import { Routes } from '@angular/router';
import { isSmartHomeAccount } from '../../../application/account-type.guard';

/** Hogares Inteligentes — rutas visibles tras login */
export const smartHomeRoutes: Routes = [
  {
    path: 'dashboard',
    canMatch: [isSmartHomeAccount],
    loadChildren: () =>
      import('../../../../dashboard/presentation/dashboard.routes').then(m => m.dashboardRoutes),
  },
  {
    path: 'security',
    canMatch: [isSmartHomeAccount],
    loadChildren: () =>
      import('../../../../security/presentation/routes/security.routes').then(m => m.securityRoutes),
  },
  {
    path: 'devices',
    canMatch: [isSmartHomeAccount],
    loadChildren: () =>
      import('../../../../device-control/device-control.routes').then(m => m.deviceControlRoutes),
  },
  {
    path: 'automation',
    canMatch: [isSmartHomeAccount],
    loadChildren: () =>
      import('../../../../automation/presentation/routes/automation.routes').then(m => m.automationRoutes),
  },
  {
    path: 'history',
    canMatch: [isSmartHomeAccount],
    loadChildren: () =>
      import('../../../../history/presentation/history.routes').then(m => m.historyRoutes),
  },
  {
    path: 'settings',
    canMatch: [isSmartHomeAccount],
    loadChildren: () =>
      import('../../../../settings/presentation/settings.routes').then(m => m.settingsRoutes),
  },
];
