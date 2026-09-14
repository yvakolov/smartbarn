import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

type Workspace = 'house' | 'materials' | 'exchange' | 'settings';

@Component({
  selector: 'sb-shell-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslocoPipe],
  template: `
    <div class="h-dvh overflow-hidden bg-[var(--sb-bg)] text-[var(--sb-text)]">
      <header class="flex h-14 items-center border-b border-[var(--sb-border)] bg-[var(--sb-surface)] px-3">
        <button class="mr-2 rounded px-2 py-1 hover:bg-[var(--sb-gray-3)]" (click)="toggleSidebar()" title="Навигация" aria-label="Навигация">☰</button>
        <strong class="text-sm">{{ 'app.name' | transloco }}</strong>
        <span class="ml-auto hidden text-xs text-[var(--sb-text-muted)] sm:inline">Smart Barn Platform</span>
      </header>

      <div class="grid h-[calc(100dvh-56px)] transition-[grid-template-columns] duration-150" [style.grid-template-columns]="sidebarOpen() ? '52px 220px minmax(0,1fr)' : '52px 0 minmax(0,1fr)'">
        <aside class="relative z-20 border-r border-[var(--sb-border)] bg-[var(--sb-surface)]">
          <nav class="flex h-full w-[52px] flex-col items-center gap-1 py-2" aria-label="Пространства">
            <button class="group relative flex h-11 w-11 items-center justify-center rounded-lg" [class.bg-[var(--sb-accent-soft)]]="activeSpace()==='house'" (click)="selectSpace('house')" aria-label="Конструкция дома">
              <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10M9.5 20v-6h5v6"/></svg>
              <span class="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded bg-[var(--sb-text)] px-2 py-1 text-xs text-[var(--sb-bg)] shadow-lg group-hover:block">Конструкция дома</span>
            </button>
            <button class="group relative flex h-11 w-11 items-center justify-center rounded-lg" [class.bg-[var(--sb-accent-soft)]]="activeSpace()==='materials'" (click)="selectSpace('materials')" aria-label="Справочник материалов">
              <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></svg>
              <span class="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded bg-[var(--sb-text)] px-2 py-1 text-xs text-[var(--sb-bg)] shadow-lg group-hover:block">Справочник материалов</span>
            </button>
            <button class="group relative flex h-11 w-11 items-center justify-center rounded-lg" [class.bg-[var(--sb-accent-soft)]]="activeSpace()==='exchange'" (click)="selectSpace('exchange')" aria-label="Обмен">
              <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 7h11m0 0-3-3m3 3-3 3M17 17H6m0 0 3 3m-3-3 3-3"/></svg>
              <span class="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded bg-[var(--sb-text)] px-2 py-1 text-xs text-[var(--sb-bg)] shadow-lg group-hover:block">Обмен</span>
            </button>
            <button class="group relative mt-auto flex h-11 w-11 items-center justify-center rounded-lg" [class.bg-[var(--sb-accent-soft)]]="activeSpace()==='settings'" (click)="selectSpace('settings')" aria-label="Настройки">
              <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.55v-.09A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4.1 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2.3V9.55h.09A1.7 1.7 0 0 0 4.1 8.5a1.7 1.7 0 0 0-.34-1.88L3.7 6.56 6.56 3.7l.06.06A1.7 1.7 0 0 0 8.5 4.1a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2.3h4.05v.09A1.7 1.7 0 0 0 15 4.1a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 8.5c.15.36.36.7.6 1 .29.34.68.48 1.1.48h.09v4.05h-.09A1.7 1.7 0 0 0 19.4 15Z"/></svg>
              <span class="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded bg-[var(--sb-text)] px-2 py-1 text-xs text-[var(--sb-bg)] shadow-lg group-hover:block">Настройки</span>
            </button>
          </nav>
          @if (touchLabel()) {<div class="pointer-events-none absolute left-[58px] top-3 z-50 whitespace-nowrap rounded bg-[var(--sb-text)] px-2 py-1 text-xs text-[var(--sb-bg)] shadow-lg md:hidden">{{ touchLabel() }}</div>}
        </aside>

        <aside class="overflow-hidden border-r border-[var(--sb-border)] bg-[var(--sb-surface)]">
          <nav class="flex h-full w-[220px] flex-col gap-1 p-3 text-sm">
            <div class="mb-2 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--sb-text-muted)]">{{ spaceTitle() }}</div>
            @switch (activeSpace()) {
              @case ('house') {<a routerLink="/app/floor-field" routerLinkActive="bg-[var(--sb-accent-soft)] text-[var(--sb-text)]" class="rounded px-3 py-2 text-[var(--sb-text-muted)]">Перекрытие</a>}
              @case ('materials') {<a routerLink="/app/materials" routerLinkActive="bg-[var(--sb-accent-soft)] text-[var(--sb-text)]" class="rounded px-3 py-2 text-[var(--sb-text-muted)]">Материалы</a>}
              @case ('exchange') {
                <a routerLink="/app/exchange/import" routerLinkActive="bg-[var(--sb-accent-soft)] text-[var(--sb-text)]" class="rounded px-3 py-2 text-[var(--sb-text-muted)]">Импорт</a>
                <a routerLink="/app/exchange/export" routerLinkActive="bg-[var(--sb-accent-soft)] text-[var(--sb-text)]" class="rounded px-3 py-2 text-[var(--sb-text-muted)]">Экспорт</a>
              }
              @case ('settings') {<a routerLink="/app/settings" routerLinkActive="bg-[var(--sb-accent-soft)] text-[var(--sb-text)]" class="rounded px-3 py-2 text-[var(--sb-text-muted)]">Общие</a>}
            }
          </nav>
        </aside>
        <main class="min-h-0 min-w-0 overflow-hidden"><router-outlet /></main>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellLayoutComponent {
  private readonly router = inject(Router);
  readonly sidebarOpen = signal(true);
  readonly activeSpace = signal<Workspace>(this.spaceFromUrl(this.router.url));
  readonly touchLabel = signal('');
  private touchTimer?: ReturnType<typeof setTimeout>;

  toggleSidebar(): void { this.sidebarOpen.update((value) => !value); }

  selectSpace(space: Workspace): void {
    this.activeSpace.set(space);
    this.touchLabel.set(this.labelForSpace(space));
    if (this.touchTimer) clearTimeout(this.touchTimer);
    this.touchTimer = setTimeout(() => this.touchLabel.set(''), 1100);
    void this.router.navigateByUrl(this.defaultUrl(space));
  }

  spaceTitle(): string { return this.labelForSpace(this.activeSpace()); }

  private defaultUrl(space: Workspace): string {
    if (space === 'house') return '/app/floor-field';
    if (space === 'materials') return '/app/materials';
    if (space === 'exchange') return '/app/exchange/import';
    return '/app/settings';
  }

  private labelForSpace(space: Workspace): string {
    if (space === 'house') return 'Конструкция дома';
    if (space === 'materials') return 'Справочник материалов';
    if (space === 'exchange') return 'Обмен';
    return 'Настройки';
  }

  private spaceFromUrl(url: string): Workspace {
    if (url.includes('/materials')) return 'materials';
    if (url.includes('/exchange') || url.includes('/import-export')) return 'exchange';
    if (url.includes('/settings')) return 'settings';
    return 'house';
  }
}
