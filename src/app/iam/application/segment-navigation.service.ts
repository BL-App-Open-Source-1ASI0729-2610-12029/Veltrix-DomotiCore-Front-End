import { Injectable, inject } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { PlatformPermission } from '../domain/model/platform-role.entity';
import { getSegmentAccessDenial } from '../domain/model/segment-route.entity';
import { AuthService } from './auth.service';
import { RolePermissionService } from './role-permission.service';

const ROUTE_PERMISSIONS: Record<string, PlatformPermission> = {
  users: 'team.manage',
};

@Injectable({ providedIn: 'root' })
export class SegmentNavigationService {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly permissions = inject(RolePermissionService);

  navigate(commands: string[], extras?: NavigationExtras): boolean {
    const tree = this.router.createUrlTree(commands, extras);
    const url = this.router.serializeUrl(tree);
    const denial = this.getDenialForUrl(url);

    if (denial) {
      void this.router.navigate(['/app/access-denied'], {
        queryParams: {
          reason: denial.reason,
          ...(denial.segment ? { segment: denial.segment } : {}),
          returnUrl: url,
        },
      });
      return false;
    }

    void this.router.navigate(commands, extras);
    return true;
  }

  navigateByUrl(url: string): boolean {
    const denial = this.getDenialForUrl(url);

    if (denial) {
      void this.router.navigate(['/app/access-denied'], {
        queryParams: {
          reason: denial.reason,
          ...(denial.segment ? { segment: denial.segment } : {}),
          returnUrl: url,
        },
      });
      return false;
    }

    void this.router.navigateByUrl(url);
    return true;
  }

  getDenialForUrl(url: string): { reason: 'segment' | 'permission'; segment?: string } | null {
    const deniedSegment = getSegmentAccessDenial(url, this.auth.getEffectiveAccountType());
    if (deniedSegment) {
      return { reason: 'segment', segment: deniedSegment };
    }

    const path = url.split('?')[0].replace(/\/+$/, '');
    const firstSegment = path.replace(/^\/app\/?/, '').split('/')[0];
    const requiredPermission = ROUTE_PERMISSIONS[firstSegment];
    if (requiredPermission && !this.permissions.can(requiredPermission)) {
      return { reason: 'permission' };
    }

    return null;
  }
}
