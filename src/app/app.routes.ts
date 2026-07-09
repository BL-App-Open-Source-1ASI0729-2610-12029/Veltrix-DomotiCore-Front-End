import { Routes } from '@angular/router';

import { AuthGuard } from './iam/infrastructure/auth.guard';
import { defaultSegmentRedirect } from './iam/infrastructure/default-segment-redirect.guard';
import { onboardingGuard } from './iam/infrastructure/onboarding.guard';
import { onboardingRouteGuard } from './iam/infrastructure/onboarding-route.guard';
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
      import('./shared/presentation/layouts/auth-layout/auth-layout.component').then(
        m => m.AuthLayoutComponent,
      ),
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./iam/presentation/pages/login/login.component').then(m => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./iam/presentation/pages/register/register.component').then(m => m.RegisterComponent),
      },
      {
        path: 'onboarding',
        canActivate: [onboardingRouteGuard],
        loadComponent: () =>
          import('./iam/presentation/pages/onboarding/onboarding-wizard.component').then(
            m => m.OnboardingWizardComponent,
          ),
        data: { wide: true },
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
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
