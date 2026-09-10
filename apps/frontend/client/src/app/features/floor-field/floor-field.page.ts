import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

type FloorFieldView = 'geometry' | 'layers' | '3d';

interface PreviewRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Interactive floor-field editor.
 *
 * Geometry is intentionally kept as local UI state during the MVP. This lets
 * us validate dimensions and drawing behaviour before connecting CQRS and the
 * application state layer.
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

  readonly lengthMm = signal(10_000);
  readonly widthMm = signal(8_000);
  readonly elevationMm = signal(0);
  readonly thicknessMm = signal(200);
  readonly activeView = signal<FloorFieldView>('geometry');

  readonly areaSquareMeters = computed(() =>
    Number(((this.lengthMm() * this.widthMm()) / 1_000_000).toFixed(2)),
  );
  readonly perimeterMeters = computed(() =>
    Number((((this.lengthMm() + this.widthMm()) * 2) / 1000).toFixed(2)),
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
