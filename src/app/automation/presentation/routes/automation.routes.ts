import { Routes } from '@angular/router';

export const automationRoutes: Routes = [
  {
    path: '',
    redirectTo: 'center',
    pathMatch: 'full',
  },
  {
    path: 'center',
    loadComponent: () =>
      import('../pages/automation-center-host/automation-center-host.component').then(
        m => m.AutomationCenterHostComponent,
      ),
  },
  {
    path: 'zones',
    loadComponent: () =>
      import('../pages/zone-configuration-host/zone-configuration-host.component').then(
        m => m.ZoneConfigurationHostComponent,
      ),
  },
  {
    path: 'builder',
    loadComponent: () =>
      import('../pages/automation-builder-host/automation-builder-host.component').then(
        m => m.AutomationBuilderHostComponent,
      ),
  },
];
