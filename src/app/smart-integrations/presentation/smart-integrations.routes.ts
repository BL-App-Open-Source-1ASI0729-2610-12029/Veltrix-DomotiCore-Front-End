import { Routes } from '@angular/router';

export const smartIntegrationsRoutes: Routes = [
  {
    path: 'integrations',
    loadComponent: () => import('./pages/integrations/integrations.component').then(m => m.IntegrationsComponent)
  },
  {
    path: 'connected-services',
    loadComponent: () => import('./pages/connected-services/connected-services.component').then(m => m.ConnectedServicesComponent)
  },
  {
    path: 'sync-status',
    loadComponent: () => import('./pages/sync-status/sync-status.component').then(m => m.SyncStatusComponent)
  },
  {
    path: 'schedules',
    loadComponent: () =>
      import('./pages/integration-schedules/integration-schedules.component').then(
        m => m.IntegrationSchedulesComponent,
      ),
  },
  {
    path: 'compatibility',
    loadComponent: () =>
      import('./pages/compatibility-checker/compatibility-checker.component').then(
        m => m.CompatibilityCheckerComponent,
      ),
  },
  {
    path: 'business-profile-api-settings',
    loadComponent: () => import('./pages/business-profile-api-settings/business-profile-api-settings.component').then(m => m.BusinessProfileApiSettingsComponent)
  },
  {
    path: '',
    redirectTo: 'integrations',
    pathMatch: 'full'
  }
];
