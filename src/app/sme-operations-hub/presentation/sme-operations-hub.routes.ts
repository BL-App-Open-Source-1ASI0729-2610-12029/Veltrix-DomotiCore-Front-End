import { Routes } from '@angular/router';

export const smeOperationsHubRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/operations-hub/operations-hub.component').then(m => m.OperationsHubComponent),
  },
];
