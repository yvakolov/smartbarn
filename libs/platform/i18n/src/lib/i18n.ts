import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  TranslocoLoader,
  TranslocoService,
  provideTransloco,
  translocoConfig,
} from '@jsverse/transloco';
import { Observable } from 'rxjs';

export type SmartBarnLocale = 'ru' | 'en';
export const SMARTBARN_DEFAULT_LOCALE: SmartBarnLocale = 'ru';
export const SMARTBARN_LOCALES: readonly SmartBarnLocale[] = ['ru', 'en'];

@Injectable({ providedIn: 'root' })
export class SmartBarnTranslocoLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`./i18n/${lang}.json`);
  }
}

export const SMARTBARN_I18N_PROVIDERS = [
  provideTransloco({
    config: translocoConfig({
      availableLangs: [...SMARTBARN_LOCALES],
      defaultLang: SMARTBARN_DEFAULT_LOCALE,
      fallbackLang: SMARTBARN_DEFAULT_LOCALE,
      reRenderOnLangChange: true,
      prodMode: true,
    }),
    loader: SmartBarnTranslocoLoader,
  }),
];

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly transloco = inject(TranslocoService);
  private readonly storageKey = 'smartbarn.locale';

  initialize(): void {
    const stored = localStorage.getItem(this.storageKey) as SmartBarnLocale | null;
    this.setLocale(stored && SMARTBARN_LOCALES.includes(stored) ? stored : SMARTBARN_DEFAULT_LOCALE);
  }

  setLocale(locale: SmartBarnLocale): void {
    this.transloco.setActiveLang(locale);
    document.documentElement.lang = locale;
    localStorage.setItem(this.storageKey, locale);
  }

  get locale(): SmartBarnLocale {
    const active = this.transloco.getActiveLang();
    return SMARTBARN_LOCALES.includes(active as SmartBarnLocale)
      ? (active as SmartBarnLocale)
      : SMARTBARN_DEFAULT_LOCALE;
  }
}
