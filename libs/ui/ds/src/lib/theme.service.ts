import { Injectable, signal } from '@angular/core';

export type SmartBarnTheme = 'system' | 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'smartbarn.theme';
  private mediaQuery?: MediaQueryList;
  readonly theme = signal<SmartBarnTheme>('system');

  initialize(): void {
    const stored = localStorage.getItem(this.storageKey) as SmartBarnTheme | null;
    const initial: SmartBarnTheme = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQuery.addEventListener('change', this.handleSystemThemeChange);
    this.setTheme(initial);
  }

  setTheme(theme: SmartBarnTheme): void {
    this.theme.set(theme);
    localStorage.setItem(this.storageKey, theme);
    this.apply(theme);
  }

  destroy(): void {
    this.mediaQuery?.removeEventListener('change', this.handleSystemThemeChange);
  }

  private readonly handleSystemThemeChange = (): void => {
    if (this.theme() === 'system') this.apply('system');
  };

  private apply(theme: SmartBarnTheme): void {
    const resolved = theme === 'system' ? (this.mediaQuery?.matches ? 'dark' : 'light') : theme;
    document.documentElement.dataset['theme'] = resolved;
    document.documentElement.style.colorScheme = resolved;
  }
}
