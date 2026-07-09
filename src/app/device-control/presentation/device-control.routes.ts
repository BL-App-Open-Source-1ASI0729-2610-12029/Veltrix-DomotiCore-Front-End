import { Routes } from '@angular/router';

export const deviceControlRoutes: Routes = [
  {
    path: 'gateway',
    loadChildren: () =>
      import('../../gateway-management/presentation/gateway-management.routes').then(
        m => m.gatewayManagementRoutes,
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./pages/device-dashboard-host/device-dashboard-host.component').then(
        m => m.DeviceDashboardHostComponent,
      ),
  },
  {
    path: ':roomId/:deviceId',
    loadComponent: () =>
      import('./pages/device-detail/device-detail.component').then(
        m => m.DeviceDetailComponent,
      ),
  },
];
