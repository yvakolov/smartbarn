import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

type FloorFieldView = 'geometry' | 'layers' | '3d';

/**
 * Interactive floor-field editor shell.
 *
 * Phase 1 keeps state local to the page so the geometry workflow can be
 * validated before wiring CQRS/SignalStore infrastructure into the UI.
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
  readonly widthMeters = signal(10);
  readonly depthMeters = signal(8);
  readonly activeView = signal<FloorFieldView>('geometry');

  readonly areaSquareMeters = computed(() => this.widthMeters() * this.depthMeters());
  readonly fieldAspectRatio = computed(() => `${this.widthMeters()} / ${this.depthMeters()}`);

  setActiveView(view: FloorFieldView): void {
    this.activeView.set(view);
  }

  updateWidth(event: Event): void {
    this.widthMeters.set(this.readDimension(event, this.widthMeters()));
  }

  updateDepth(event: Event): void {
    this.depthMeters.set(this.readDimension(event, this.depthMeters()));
  }

  private readDimension(event: Event, fallback: number): number {
    const value = Number((event.target as HTMLInputElement).value);

    if (!Number.isFinite(value)) {
      return fallback;
    }

    return Math.min(50, Math.max(1, value));
  }
}
