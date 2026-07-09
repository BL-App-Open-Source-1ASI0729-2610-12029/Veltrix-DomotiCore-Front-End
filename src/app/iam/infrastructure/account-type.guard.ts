import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { AuthService } from '../application/auth.service';

export const isSmartHomeAccount: CanMatchFn = () =>
  inject(AuthService).getEffectiveAccountType() === 'smart-home';

export const isSmallBusinessAccount: CanMatchFn = () =>
  inject(AuthService).getEffectiveAccountType() === 'small-business';
