import { Routes } from '@angular/router';
import { isSmallBusinessAccount } from '../../../infrastructure/account-type.guard';
import { requireTeamManagement } from '../../../infrastructure/role.guard';

/** Pequeños Negocios y Emprendedores — rutas visibles tras login */
export const smallBusinessRoutes: Routes = [
  {
    path: 'operations-hub',
    canMatch: [isSmallBusinessAccount],
    loadChildren: () =>
      import('../../../../sme-operations-hub/presentation/sme-operations-hub.routes').then(
        m => m.smeOperationsHubRoutes,
      ),
  },
  {
    path: 'devices',
    canMatch: [isSmallBusinessAccount],
    loadChildren: () =>
      import('../../../../device-control/presentation/business-device.routes').then(m => m.businessDeviceRoutes),
  },
  {
    path: 'reports',
    canMatch: [isSmallBusinessAccount],
    loadChildren: () =>
      import('../../../../history/presentation/business-reports.routes').then(
        m => m.businessReportsRoutes,
      ),
  },
  {
    path: 'smart-integrations',
    canMatch: [isSmallBusinessAccount],
    loadChildren: () =>
      import('../../../../smart-integrations/presentation/smart-integrations.routes').then(
        m => m.smartIntegrationsRoutes,
      ),
  },
  {
    path: 'automation',
    canMatch: [isSmallBusinessAccount],
    loadChildren: () =>
      import('../../../../automation/presentation/automation.routes').then(m => m.automationRoutes),
  },
  {
    path: 'users',
    canMatch: [isSmallBusinessAccount, requireTeamManagement],
    loadChildren: () =>
      import('../../../../team-management/presentation/team-management.routes').then(
        m => m.teamManagementRoutes,
      ),
  },
  {
    path: 'settings',
    canMatch: [isSmallBusinessAccount],
    loadChildren: () =>
      import('../../../../settings/presentation/settings.routes').then(m => m.settingsRoutes),
  },
];
