import { Routes } from '@angular/router';

import { AuthGuard } from './iam/infrastructure/auth.guard';
import { defaultSegmentRedirect } from './iam/infrastructure/default-segment-redirect.guard';
import { onboardingGuard } from './iam/infrastructure/onboarding.guard';
import { smartHomeRoutes } from './iam/presentation/views/smart-home/smart-home.routes';
import { smallBusinessRoutes } from './iam/presentation/views/small-business/small-business.routes';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./shared/presentation/layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      {
        path: '',
        loadChildren: () => import('./iam/presentation/iam.routes').then(m => m.iamRoutes),
      },
    ],
  },
  {
    path: 'app',
    loadComponent: () =>
      import('./iam/presentation/views/account-shell.component').then(m => m.AccountShellComponent),
    canActivate: [AuthGuard, onboardingGuard],
    children: [
      ...smartHomeRoutes,
      ...smallBusinessRoutes,
      {
        path: 'access-denied',
        loadComponent: () =>
          import('./shared/presentation/pages/access-denied/access-denied.component').then(
            m => m.AccessDeniedComponent,
          ),
      },
      {
        path: '',
        pathMatch: 'full',
        canActivate: [defaultSegmentRedirect],
      },
      {
        path: '**',
        loadComponent: () =>
          import('./shared/presentation/pages/access-denied/access-denied.component').then(
            m => m.AccessDeniedComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'auth',
  },
];
