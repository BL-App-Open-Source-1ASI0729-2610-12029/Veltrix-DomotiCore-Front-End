import { Routes } from '@angular/router';
import { onboardingRouteGuard } from '../infrastructure/onboarding-route.guard';

export const iamRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'onboarding',
    canActivate: [onboardingRouteGuard],
    loadComponent: () =>
      import('./pages/onboarding/onboarding-wizard.component').then(m => m.OnboardingWizardComponent),
    data: { wide: true },
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
