import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { PlatformPermission } from '../domain/model/platform-role.entity';
import { AuthService } from '../application/auth.service';
import { RolePermissionService } from '../application/role-permission.service';

export function requirePermission(
  permission: PlatformPermission,
  fallbackRoute = '/app/dashboard',
): CanMatchFn {
  return () => {
    const perms = inject(RolePermissionService);
    const auth = inject(AuthService);
    const router = inject(Router);

    if (perms.can(permission)) {
      return true;
    }

    const route =
      auth.getEffectiveAccountType() === 'small-business'
        ? '/app/operations-hub'
        : fallbackRoute;

    return router.createUrlTree([route]);
  };
}

export const requireTeamManagement = requirePermission('team.manage', '/app/operations-hub');
export const requireBusinessProfile = requirePermission('business.profile', '/app/users/team');
