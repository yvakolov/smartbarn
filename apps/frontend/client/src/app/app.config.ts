import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding, withHashLocation } from '@angular/router';
import { SMARTBARN_I18N_PROVIDERS } from '@smartbarn/platform-i18n';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideRouter(appRoutes, withComponentInputBinding(), withHashLocation()),
    ...SMARTBARN_I18N_PROVIDERS,
  ],
};
