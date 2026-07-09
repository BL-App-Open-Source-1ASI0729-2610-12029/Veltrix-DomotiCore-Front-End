import { Routes } from '@angular/router';

export const securityRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/security-access/security-access.component').then(
        m => m.SecurityAccessComponent,
      ),
  },
];
