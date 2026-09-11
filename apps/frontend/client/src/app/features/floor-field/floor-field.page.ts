import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { FloorField3dComponent } from './floor-field-3d.component';

type FloorFieldView = 'geometry' | 'layers' | '3d';
type FloorLayerKind = 'sip' | 'finish' | 'screed' | 'insulation' | 'structure' | 'ceiling' | 'custom';
type ResizeHandle = 'length' | 'width' | 'both';

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
  readonly color: string;
}

@Component({
  selector: 'smartbarn-floor-field-page',
  standalone: true,
  imports: [TranslocoPipe, FloorField3dComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './floor-field.page.html',
  styleUrl: './floor-field.page.scss',
})
export class FloorFieldPage {
  private static readonly GRID_STEP_MM = 100;
  private static readonly MIN_DIMENSION_MM = 500;
  private static readonly MAX_DIMENSION_MM = 50_000;
  private static readonly PREVIEW_MAX_WIDTH = 720;
  private static readonly PREVIEW_MAX_HEIGHT = 440;
  private nextLayerId = 2;
  private draggedLayerId: number | null = null;
  private dragResizeState: { handle: ResizeHandle; startX: number; startY: number; startLength: number; startWidth: number } | null = null;

  readonly lengthMm = signal(9_000);
  readonly widthMm = signal(6_000);
  readonly elevationMm = signal(0);
  readonly activeView = signal<FloorFieldView>('geometry');
  readonly snapToGrid = signal(true);
  readonly layers = signal<readonly FloorLayer[]>([
    { id: 1, kind: 'sip', name: 'SIP-панель 224 мм', thicknessMm: 224, color: '#d9b36c' },
  ]);
  readonly dragOverLayerId = signal<number | null>(null);
  readonly dragOverPosition = signal<'before' | 'after' | null>(null);

  readonly areaSquareMeters = computed(() => Number(((this.lengthMm() * this.widthMm()) / 1_000_000).toFixed(2)));
  readonly perimeterMeters = computed(() => Number((((this.lengthMm() + this.widthMm()) * 2) / 1000).toFixed(2)));
  readonly totalLayerThicknessMm = computed(() => this.layers().reduce((total, layer) => total + layer.thicknessMm, 0));
  readonly previewRect = computed<PreviewRect>(() => {
    const availableWidth = FloorFieldPage.PREVIEW_MAX_WIDTH;
    const availableHeight = FloorFieldPage.PREVIEW_MAX_HEIGHT;
    const aspect = this.lengthMm() / this.widthMm();
    const availableAspect = availableWidth / availableHeight;
    const width = aspect >= availableAspect ? availableWidth : availableHeight * aspect;
    const height = aspect >= availableAspect ? availableWidth / aspect : availableHeight;
    return { x: (1000 - width) / 2, y: (650 - height) / 2, width, height };
  });

  setActiveView(view: FloorFieldView): void { this.activeView.set(view); }
  updateLength(event: Event): void { this.lengthMm.set(this.snapDimension(this.readDimension(event, this.lengthMm()))); }
  updateWidth(event: Event): void { this.widthMm.set(this.snapDimension(this.readDimension(event, this.widthMm()))); }
  updateElevation(event: Event): void { this.elevationMm.set(this.readNumber(event, this.elevationMm(), -10_000, 50_000)); }
  toggleSnapToGrid(): void { this.snapToGrid.update((value) => !value); }

  startResize(handle: ResizeHandle, event: PointerEvent): void {
    event.preventDefault();
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
    this.dragResizeState = { handle, startX: event.clientX, startY: event.clientY, startLength: this.lengthMm(), startWidth: this.widthMm() };
  }

  resizeGeometry(event: PointerEvent): void {
    const state = this.dragResizeState;
    if (!state) return;
    const rect = this.previewRect();
    const pxPerLengthMm = rect.width / state.startLength;
    const pxPerWidthMm = rect.height / state.startWidth;
    if (state.handle === 'length' || state.handle === 'both') {
      this.lengthMm.set(this.snapDimension(state.startLength + (event.clientX - state.startX) / Math.max(pxPerLengthMm, 0.0001)));
    }
    if (state.handle === 'width' || state.handle === 'both') {
      this.widthMm.set(this.snapDimension(state.startWidth + (event.clientY - state.startY) / Math.max(pxPerWidthMm, 0.0001)));
    }
  }

  stopResize(): void { this.dragResizeState = null; }

  updateLayerThickness(layerId: number, event: Event): void {
    const layer = this.layers().find((item) => item.id === layerId);
    if (!layer) return;
    const thicknessMm = this.readNumber(event, layer.thicknessMm, 1, 2000);
    this.layers.update((layers) => layers.map((item) => item.id === layerId ? { ...item, thicknessMm } : item));
  }

  updateLayerName(layerId: number, event: Event): void {
    const name = (event.target as HTMLInputElement).value.trim() || 'Слой';
    this.layers.update((layers) => layers.map((item) => item.id === layerId ? { ...item, name } : item));
  }

  updateLayerColor(layerId: number, event: Event): void {
    const color = (event.target as HTMLInputElement).value;
    this.layers.update((layers) => layers.map((item) => item.id === layerId ? { ...item, color } : item));
  }

  addLayer(position: 'top' | 'bottom'): void {
    const id = this.nextLayerId++;
    const layer: FloorLayer = { id, kind: 'custom', name: 'Новый слой', thicknessMm: 20, color: '#38bdf8' };
    this.layers.update((layers) => position === 'top' ? [layer, ...layers] : [...layers, layer]);
  }

  removeLayer(layerId: number): void { this.layers.update((layers) => layers.filter((layer) => layer.id !== layerId)); }
  moveLayer(layerId: number, direction: -1 | 1): void {
    this.layers.update((layers) => {
      const index = layers.findIndex((layer) => layer.id === layerId);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= layers.length) return layers;
      const reordered = [...layers];
      [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
      return reordered;
    });
  }

  startLayerDrag(layerId: number, event: DragEvent): void {
    this.draggedLayerId = layerId;
    event.dataTransfer?.setData('text/plain', String(layerId));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  allowLayerDrop(targetLayerId: number, event: DragEvent): void {
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    const box = target.getBoundingClientRect();
    this.dragOverLayerId.set(targetLayerId);
    this.dragOverPosition.set(event.clientY < box.top + box.height / 2 ? 'before' : 'after');
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  dropLayer(targetLayerId: number, event: DragEvent): void {
    event.preventDefault();
    const sourceLayerId = this.draggedLayerId ?? Number(event.dataTransfer?.getData('text/plain'));
    const position = this.dragOverPosition() ?? 'before';
    this.clearDragState();
    if (!Number.isFinite(sourceLayerId) || sourceLayerId === targetLayerId) return;
    this.layers.update((layers) => {
      const sourceIndex = layers.findIndex((layer) => layer.id === sourceLayerId);
      let targetIndex = layers.findIndex((layer) => layer.id === targetLayerId);
      if (sourceIndex < 0 || targetIndex < 0) return layers;
      const reordered = [...layers];
      const [moved] = reordered.splice(sourceIndex, 1);
      if (sourceIndex < targetIndex) targetIndex--;
      reordered.splice(position === 'after' ? targetIndex + 1 : targetIndex, 0, moved);
      return reordered;
    });
  }

  endLayerDrag(): void { this.clearDragState(); }
  swapDimensions(): void { const length = this.lengthMm(); this.lengthMm.set(this.widthMm()); this.widthMm.set(length); }
  resetGeometry(): void { this.lengthMm.set(9_000); this.widthMm.set(6_000); this.elevationMm.set(0); }

  private clearDragState(): void { this.draggedLayerId = null; this.dragOverLayerId.set(null); this.dragOverPosition.set(null); }
  private snapDimension(value: number): number {
    const snapped = this.snapToGrid() ? Math.round(value / FloorFieldPage.GRID_STEP_MM) * FloorFieldPage.GRID_STEP_MM : Math.round(value);
    return Math.min(FloorFieldPage.MAX_DIMENSION_MM, Math.max(FloorFieldPage.MIN_DIMENSION_MM, snapped));
  }
  private readDimension(event: Event, fallback: number): number { return this.readNumber(event, fallback, FloorFieldPage.MIN_DIMENSION_MM, FloorFieldPage.MAX_DIMENSION_MM); }
  private readNumber(event: Event, fallback: number, min: number, max: number): number {
    const value = Number((event.target as HTMLInputElement).value);
    return Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;
  }
}
