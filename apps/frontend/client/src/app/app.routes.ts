import type { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: 'auth',
    loadComponent: () =>
      import('./layouts/auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login.page').then((m) => m.LoginPage),
      },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
    ],
  },
  {
    path: 'app',
    loadComponent: () =>
      import('./layouts/shell-layout/shell-layout.component').then((m) => m.ShellLayoutComponent),
    children: [
      {
        path: 'floor-field',
        loadComponent: () =>
          import('./features/floor-field/floor-field.page').then((m) => m.FloorFieldPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.page').then((m) => m.SettingsPage),
      },
      { path: '', pathMatch: 'full', redirectTo: 'floor-field' },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'app/floor-field' },
  { path: '**', redirectTo: 'app/floor-field' },
];
