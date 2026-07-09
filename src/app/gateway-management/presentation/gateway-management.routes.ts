import { Routes } from '@angular/router';

export const gatewayManagementRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/gateway-setup/gateway-setup.component').then(m => m.GatewaySetupComponent),
  },
];
