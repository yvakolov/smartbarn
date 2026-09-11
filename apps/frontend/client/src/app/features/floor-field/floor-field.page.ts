import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

type FloorFieldView = 'geometry' | 'layers' | '3d';
type FloorLayerKind = 'finish' | 'screed' | 'insulation' | 'structure' | 'ceiling' | 'custom';

interface PreviewRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface FloorLayer {
  readonly id: number;
  readonly kind: FloorLayerKind;
  readonly name: string;
  readonly thicknessMm: number;
}

/**
 * Interactive floor-field editor.
 *
 * Geometry and layer assembly are intentionally kept as local UI state during
 * the MVP. The interaction contract can later dispatch the existing CQRS
 * commands without coupling this page to the application state layer yet.
 */
@Component({
  selector: 'smartbarn-floor-field-page',
  standalone: true,
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './floor-field.page.html',
  styleUrl: './floor-field.page.scss',
})
export class FloorFieldPage {
  private static readonly MIN_DIMENSION_MM = 500;
  private static readonly MAX_DIMENSION_MM = 50_000;
  private static readonly PREVIEW_MAX_WIDTH = 720;
  private static readonly PREVIEW_MAX_HEIGHT = 440;
  private nextLayerId = 6;
  private draggedLayerId: number | null = null;

  readonly lengthMm = signal(10_000);
  readonly widthMm = signal(8_000);
  readonly elevationMm = signal(0);
  readonly thicknessMm = signal(200);
  readonly activeView = signal<FloorFieldView>('geometry');
  readonly layers = signal<readonly FloorLayer[]>([
    { id: 1, kind: 'finish', name: 'floorField.layerFinish', thicknessMm: 15 },
    { id: 2, kind: 'screed', name: 'floorField.layerScreed', thicknessMm: 60 },
    { id: 3, kind: 'insulation', name: 'floorField.layerInsulation', thicknessMm: 50 },
    { id: 4, kind: 'structure', name: 'floorField.layerStructure', thicknessMm: 200 },
    { id: 5, kind: 'ceiling', name: 'floorField.layerCeiling', thicknessMm: 15 },
  ]);

  readonly areaSquareMeters = computed(() =>
    Number(((this.lengthMm() * this.widthMm()) / 1_000_000).toFixed(2)),
  );
  readonly perimeterMeters = computed(() =>
    Number((((this.lengthMm() + this.widthMm()) * 2) / 1000).toFixed(2)),
  );
  readonly totalLayerThicknessMm = computed(() =>
    this.layers().reduce((total, layer) => total + layer.thicknessMm, 0),
  );
  readonly previewRect = computed<PreviewRect>(() => {
    const availableWidth = FloorFieldPage.PREVIEW_MAX_WIDTH;
    const availableHeight = FloorFieldPage.PREVIEW_MAX_HEIGHT;
    const aspect = this.lengthMm() / this.widthMm();
    const availableAspect = availableWidth / availableHeight;

    const width = aspect >= availableAspect ? availableWidth : availableHeight * aspect;
    const height = aspect >= availableAspect ? availableWidth / aspect : availableHeight;

    return {
      x: (1000 - width) / 2,
      y: (650 - height) / 2,
      width,
      height,
    };
  });

  setActiveView(view: FloorFieldView): void {
    this.activeView.set(view);
  }

  updateLength(event: Event): void {
    this.lengthMm.set(this.readDimension(event, this.lengthMm()));
  }

  updateWidth(event: Event): void {
    this.widthMm.set(this.readDimension(event, this.widthMm()));
  }

  updateElevation(event: Event): void {
    this.elevationMm.set(this.readNumber(event, this.elevationMm(), -10_000, 50_000));
  }

  updateThickness(event: Event): void {
    this.thicknessMm.set(this.readNumber(event, this.thicknessMm(), 20, 2000));
  }

  updateLayerThickness(layerId: number, event: Event): void {
    const layer = this.layers().find((item) => item.id === layerId);
    if (!layer) {
      return;
    }

    const thicknessMm = this.readNumber(event, layer.thicknessMm, 1, 2000);
    this.layers.update((layers) =>
      layers.map((item) => (item.id === layerId ? { ...item, thicknessMm } : item)),
    );
  }

  addLayer(): void {
    const id = this.nextLayerId++;
    this.layers.update((layers) => [
      ...layers,
      { id, kind: 'custom', name: 'floorField.layerCustom', thicknessMm: 20 },
    ]);
  }

  removeLayer(layerId: number): void {
    this.layers.update((layers) => layers.filter((layer) => layer.id !== layerId));
  }

  moveLayer(layerId: number, direction: -1 | 1): void {
    this.layers.update((layers) => {
      const index = layers.findIndex((layer) => layer.id === layerId);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= layers.length) {
        return layers;
      }

      const reordered = [...layers];
      [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
      return reordered;
    });
  }

  startLayerDrag(layerId: number, event: DragEvent): void {
    this.draggedLayerId = layerId;
    event.dataTransfer?.setData('text/plain', String(layerId));
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  allowLayerDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  dropLayer(targetLayerId: number, event: DragEvent): void {
    event.preventDefault();
    const sourceLayerId = this.draggedLayerId ?? Number(event.dataTransfer?.getData('text/plain'));
    this.draggedLayerId = null;

    if (!Number.isFinite(sourceLayerId) || sourceLayerId === targetLayerId) {
      return;
    }

    this.layers.update((layers) => {
      const sourceIndex = layers.findIndex((layer) => layer.id === sourceLayerId);
      const targetIndex = layers.findIndex((layer) => layer.id === targetLayerId);
      if (sourceIndex < 0 || targetIndex < 0) {
        return layers;
      }

      const reordered = [...layers];
      const [moved] = reordered.splice(sourceIndex, 1);
      reordered.splice(targetIndex, 0, moved);
      return reordered;
    });
  }

  endLayerDrag(): void {
    this.draggedLayerId = null;
  }

  swapDimensions(): void {
    const length = this.lengthMm();
    this.lengthMm.set(this.widthMm());
    this.widthMm.set(length);
  }

  resetGeometry(): void {
    this.lengthMm.set(10_000);
    this.widthMm.set(8_000);
    this.elevationMm.set(0);
    this.thicknessMm.set(200);
  }

  private readDimension(event: Event, fallback: number): number {
    return this.readNumber(
      event,
      fallback,
      FloorFieldPage.MIN_DIMENSION_MM,
      FloorFieldPage.MAX_DIMENSION_MM,
    );
  }

  private readNumber(event: Event, fallback: number, min: number, max: number): number {
    const value = Number((event.target as HTMLInputElement).value);

    if (!Number.isFinite(value)) {
      return fallback;
    }

    return Math.min(max, Math.max(min, Math.round(value)));
  }
}
