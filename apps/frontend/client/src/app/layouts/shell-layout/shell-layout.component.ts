import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'sb-shell-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslocoPipe],
  template: `
    <div class="min-h-dvh bg-[var(--sb-bg)] text-[var(--sb-text)] lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside class="hidden border-r border-[var(--sb-border)] bg-[var(--sb-surface)] lg:flex lg:min-h-dvh lg:flex-col">
        <div class="border-b border-[var(--sb-border)] px-5 py-4 text-sm font-semibold tracking-wide">
          {{ 'app.name' | transloco }}
        </div>
        <nav class="flex flex-1 flex-col gap-1 p-3 text-sm">
          <a
            routerLink="/app/floor-field"
            routerLinkActive="bg-[var(--sb-accent-soft)] text-[var(--sb-text)]"
            class="rounded-[var(--sb-radius-2)] px-3 py-2 text-[var(--sb-text-muted)] hover:bg-[var(--sb-gray-3)]"
          >
            {{ 'app.floorField' | transloco }}
          </a>
          <a
            routerLink="/app/settings"
            routerLinkActive="bg-[var(--sb-accent-soft)] text-[var(--sb-text)]"
            class="rounded-[var(--sb-radius-2)] px-3 py-2 text-[var(--sb-text-muted)] hover:bg-[var(--sb-gray-3)]"
          >
            {{ 'app.settings' | transloco }}
          </a>
        </nav>
      </aside>

      <div class="min-w-0">
        <header class="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[var(--sb-border)] bg-[color:var(--sb-surface)/0.96] px-4 backdrop-blur sm:px-6 lg:px-8">
          <strong class="text-sm lg:hidden">{{ 'app.name' | transloco }}</strong>
          <span class="hidden text-xs text-[var(--sb-text-muted)] lg:inline">Smart Barn Platform</span>
          <a routerLink="/app/settings" class="rounded-[var(--sb-radius-2)] px-3 py-2 text-sm hover:bg-[var(--sb-gray-3)]">
            {{ 'app.settings' | transloco }}
          </a>
        </header>

        <main class="pb-20 lg:pb-0">
          <router-outlet />
        </main>
      </div>

      <nav class="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 border-t border-[var(--sb-border)] bg-[var(--sb-surface-raised)] p-2 lg:hidden">
        <a
          routerLink="/app/floor-field"
          routerLinkActive="bg-[var(--sb-accent-soft)]"
          class="rounded-[var(--sb-radius-2)] px-3 py-2 text-center text-sm"
        >
          {{ 'app.floorField' | transloco }}
        </a>
        <a
          routerLink="/app/settings"
          routerLinkActive="bg-[var(--sb-accent-soft)]"
          class="rounded-[var(--sb-radius-2)] px-3 py-2 text-center text-sm"
        >
          {{ 'app.settings' | transloco }}
        </a>
      </nav>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellLayoutComponent {}
