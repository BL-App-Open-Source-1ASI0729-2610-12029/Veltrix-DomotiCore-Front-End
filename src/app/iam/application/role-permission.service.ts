import { Injectable, inject } from '@angular/core';
import {
  PlatformPermission,
  PlatformRole,
  normalizePlatformRole,
  permissionsForRole,
  roleLabelKey,
} from '../domain/model/platform-role.entity';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class RolePermissionService {
  private readonly auth = inject(AuthService);

  getRole(): PlatformRole {
    return normalizePlatformRole(this.auth.currentUser?.role);
  }

  roleLabelKey(): string {
    return roleLabelKey(this.getRole());
  }

  can(permission: PlatformPermission): boolean {
    return permissionsForRole(this.getRole()).includes(permission);
  }

  canManageTeam(): boolean {
    return this.can('team.manage');
  }

  canInviteTeamMembers(): boolean {
    return this.can('team.invite');
  }

  canDeleteTeamMembers(): boolean {
    return this.can('team.delete');
  }

  canManageAuthorizedUsers(): boolean {
    return this.can('settings.authorizedUsers');
  }

  canAccessSystemSettings(): boolean {
    return this.can('settings.system');
  }

  canRegisterMaintenance(): boolean {
    return this.can('maintenance.register');
  }

  canExportData(): boolean {
    return this.can('export.data');
  }

  canManageGateways(): boolean {
    return this.can('gateway.manage');
  }

  canManageIntegrations(): boolean {
    return this.can('integrations.manage');
  }

  canEditBusinessProfile(): boolean {
    return this.can('business.profile');
  }

  canDeleteDevices(): boolean {
    return this.can('devices.delete');
  }
}
