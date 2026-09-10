import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'smartbarn-floor-field-page',
  standalone: true,
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex min-h-0 flex-1 flex-col gap-4">
      <header>
        <p class="text-sm text-[var(--sb-color-text-muted)]">{{ 'editor.floorField' | transloco }}</p>
        <h1 class="text-2xl font-semibold text-[var(--sb-color-text)]">{{ 'editor.title' | transloco }}</h1>
      </header>

      <div class="grid min-h-[32rem] flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <main class="min-h-[28rem] rounded-[var(--sb-radius-4)] border border-[var(--sb-color-border)] bg-[var(--sb-color-panel)]">
          <nav class="flex gap-1 border-b border-[var(--sb-color-border)] p-2" aria-label="Editor views">
            <button class="rounded-[var(--sb-radius-2)] px-3 py-2 text-sm font-medium">{{ 'editor.geometry' | transloco }}</button>
            <button class="rounded-[var(--sb-radius-2)] px-3 py-2 text-sm font-medium">{{ 'editor.layers' | transloco }}</button>
            <button class="rounded-[var(--sb-radius-2)] px-3 py-2 text-sm font-medium">3D</button>
          </nav>
          <div class="grid h-[calc(100%-3.5rem)] place-items-center p-6 text-sm text-[var(--sb-color-text-muted)]">
            Floor Field canvas
          </div>
        </main>

        <aside class="rounded-[var(--sb-radius-4)] border border-[var(--sb-color-border)] bg-[var(--sb-color-panel)] p-4">
          <h2 class="font-semibold">{{ 'editor.properties' | transloco }}</h2>
        </aside>
      </div>
    </section>
  `,
})
export class FloorFieldPage {}
