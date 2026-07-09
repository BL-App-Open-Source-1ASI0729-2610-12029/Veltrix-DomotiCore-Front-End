import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isOnboardingComplete } from '../domain/model/account-type.entity';
import { AuthService } from './auth.service';

/** Blocks /app routes until the user finishes onboarding. */
export const onboardingGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  const user = auth.currentUser;
  if (isOnboardingComplete(user?.accountType, user?.onboardingCompleted, user?.role)) {
    return true;
  }

  return router.createUrlTree(['/auth/onboarding']);
};
