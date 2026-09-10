import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LocaleService, type SmartBarnLocale } from '@smartbarn/platform-i18n';
import { ThemeService, type SmartBarnTheme } from '@smartbarn/ui-ds';

@Component({
  selector: 'smartbarn-settings-page',
  standalone: true,
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto w-full max-w-3xl space-y-6">
      <h1 class="text-2xl font-semibold">{{ 'settings.title' | transloco }}</h1>
      <div class="rounded-[var(--sb-radius-4)] border border-[var(--sb-color-border)] bg-[var(--sb-color-panel)] p-5">
        <h2 class="font-semibold">{{ 'settings.appearance' | transloco }}</h2>
        <div class="mt-4 flex flex-wrap gap-2">
          @for (theme of themes; track theme.value) {
            <button class="rounded-[var(--sb-radius-2)] border border-[var(--sb-color-border)] px-3 py-2" (click)="setTheme(theme.value)">
              {{ theme.label | transloco }}
            </button>
          }
        </div>
      </div>
      <div class="rounded-[var(--sb-radius-4)] border border-[var(--sb-color-border)] bg-[var(--sb-color-panel)] p-5">
        <h2 class="font-semibold">{{ 'settings.language' | transloco }}</h2>
        <div class="mt-4 flex gap-2">
          <button class="rounded-[var(--sb-radius-2)] border border-[var(--sb-color-border)] px-3 py-2" (click)="setLanguage('ru')">Русский</button>
          <button class="rounded-[var(--sb-radius-2)] border border-[var(--sb-color-border)] px-3 py-2" (click)="setLanguage('en')">English</button>
        </div>
      </div>
    </section>
  `,
})
export class SettingsPage {
  private readonly locale = inject(LocaleService);
  private readonly theme = inject(ThemeService);

  readonly themes: ReadonlyArray<{ value: SmartBarnTheme; label: string }> = [
    { value: 'system', label: 'settings.themeSystem' },
    { value: 'light', label: 'settings.themeLight' },
    { value: 'dark', label: 'settings.themeDark' },
  ];

  setTheme(value: SmartBarnTheme): void {
    this.theme.setTheme(value);
  }

  setLanguage(value: SmartBarnLocale): void {
    this.locale.setLocale(value);
  }
}
