import { Routes } from '@angular/router';

/** Pequeños Negocios — gestión y exploración de dispositivos */
export const businessDeviceRoutes: Routes = [
  {
    path: '',
    redirectTo: 'management',
    pathMatch: 'full',
  },
  {
    path: 'management',
    loadComponent: () =>
      import('./pages/business-device-management/business-device-management.component').then(
        m => m.BusinessDeviceManagementComponent,
      ),
  },
  {
    path: 'gateway',
    loadChildren: () =>
      import('../../gateway-management/presentation/gateway-management.routes').then(
        m => m.gatewayManagementRoutes,
      ),
  },
  {
    path: 'maintenance',
    loadComponent: () =>
      import('./pages/maintenance-hub/maintenance-hub.component').then(
        m => m.MaintenanceHubComponent,
      ),
  },
  {
    path: 'explorer',
    loadComponent: () =>
      import('./pages/device-explorer/device-explorer.component').then(
        m => m.DeviceExplorerComponent,
      ),
  },
  {
    path: ':zoneId/:deviceId',
    loadComponent: () =>
      import('./pages/business-device-detail/business-device-detail.component').then(
        m => m.BusinessDeviceDetailComponent,
      ),
  },
];
