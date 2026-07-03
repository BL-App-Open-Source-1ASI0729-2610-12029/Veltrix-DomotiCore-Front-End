import { Routes } from '@angular/router';
import { requireBusinessProfile } from '../../iam/application/role.guard';

/** Pequeños Negocios — usuarios y perfil empresarial */
export const teamManagementRoutes: Routes = [
  {
    path: '',
    redirectTo: 'team',
    pathMatch: 'full',
  },
  {
    path: 'team',
    loadComponent: () =>
      import('./pages/team-management/team-management.component').then(
        m => m.TeamManagementComponent,
      ),
  },
  {
    path: 'business-profile',
    canMatch: [requireBusinessProfile],
    loadComponent: () =>
      import('../../smart-integrations/presentation/pages/business-profile-api-settings/business-profile-api-settings.component').then(
        m => m.BusinessProfileApiSettingsComponent,
      ),
  },
];
