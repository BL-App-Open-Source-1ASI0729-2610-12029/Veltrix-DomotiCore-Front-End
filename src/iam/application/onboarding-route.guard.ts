import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isOnboardingComplete } from '../domain/model/account-type.entity';
import { AuthService } from './auth.service';

/** Protects /auth/onboarding — requires login, redirects if already completed. */
export const onboardingRouteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  const user = auth.currentUser;
  if (isOnboardingComplete(user?.accountType, user?.onboardingCompleted, user?.role)) {
    return router.createUrlTree([auth.getDefaultRoute()]);
  }

  return true;
};
