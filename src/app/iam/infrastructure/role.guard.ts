import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { PlatformPermission } from '../domain/model/platform-role.entity';
import { RolePermissionService } from '../application/role-permission.service';

export function requirePermission(
  permission: PlatformPermission,
): CanMatchFn {
  return () => {
    const perms = inject(RolePermissionService);
    const router = inject(Router);

    if (perms.can(permission)) {
      return true;
    }

    return router.createUrlTree(['/app/access-denied'], {
      queryParams: { reason: 'permission' },
    });
  };
}

export const requireTeamManagement = requirePermission('team.manage');
export const requireBusinessProfile = requirePermission('business.profile');
