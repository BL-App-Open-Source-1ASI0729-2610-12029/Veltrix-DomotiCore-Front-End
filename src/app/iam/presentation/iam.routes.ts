import { Routes } from '@angular/router';
import { onboardingRouteGuard } from '../infrastructure/onboarding-route.guard';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';

export const iamRoutes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
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
