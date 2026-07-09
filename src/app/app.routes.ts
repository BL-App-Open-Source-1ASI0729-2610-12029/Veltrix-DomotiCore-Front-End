import { Routes } from '@angular/router';

import { AuthGuard } from './iam/infrastructure/auth.guard';
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
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'auth',
  },
];
