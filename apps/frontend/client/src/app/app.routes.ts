import type { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: 'app',
    loadComponent: () =>
      import('./layouts/shell-layout/shell-layout.component').then((m) => m.ShellLayoutComponent),
    children: [
      {
        path: 'foundation',
        data: { mode: 'foundation' },
        loadComponent: () =>
          import('./features/building-structure/building-structure.page').then((m) => m.BuildingStructurePage),
      },
      {
        path: 'storeys',
        data: { mode: 'storeys' },
        loadComponent: () =>
          import('./features/building-structure/building-structure.page').then((m) => m.BuildingStructurePage),
      },
      {
        path: 'floor-field',
        loadComponent: () =>
          import('./features/floor-field/floor-field.page').then((m) => m.FloorFieldPage),
      },
      {
        path: 'materials',
        loadComponent: () =>
          import('./features/materials/materials.page').then((m) => m.MaterialsPage),
      },
      {
        path: 'exchange/import',
        data: { transportTab: 'import' },
        loadComponent: () =>
          import('./features/import-export/import-export.page').then((m) => m.ImportExportPage),
      },
      {
        path: 'exchange/export',
        data: { transportTab: 'export' },
        loadComponent: () =>
          import('./features/import-export/import-export.page').then((m) => m.ImportExportPage),
      },
      { path: 'import-export', pathMatch: 'full', redirectTo: 'exchange/import' },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.page').then((m) => m.SettingsPage),
      },
      { path: '', pathMatch: 'full', redirectTo: 'foundation' },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'app/foundation' },
  { path: '**', redirectTo: 'app/foundation' },
];
