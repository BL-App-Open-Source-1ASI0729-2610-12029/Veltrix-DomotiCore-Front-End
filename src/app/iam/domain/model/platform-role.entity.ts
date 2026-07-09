export type PlatformRole = 'Admin' | 'Moderator' | 'User';

export type PlatformPermission =
  | 'segment.both'
  | 'team.manage'
  | 'team.invite'
  | 'team.delete'
  | 'settings.access'
  | 'settings.system'
  | 'settings.authorizedUsers'
  | 'devices.delete'
  | 'maintenance.register'
  | 'export.data'
  | 'gateway.manage'
  | 'integrations.manage'
  | 'business.profile';

const ROLE_PERMISSIONS: Record<PlatformRole, PlatformPermission[]> = {
  Admin: [
    'segment.both',
    'team.manage',
    'team.invite',
    'team.delete',
    'settings.access',
    'settings.system',
    'settings.authorizedUsers',
    'devices.delete',
    'maintenance.register',
    'export.data',
    'gateway.manage',
    'integrations.manage',
    'business.profile',
  ],
  Moderator: [
    'team.manage',
    'team.invite',
    'settings.access',
    'settings.authorizedUsers',
    'devices.delete',
    'maintenance.register',
    'export.data',
    'gateway.manage',
    'integrations.manage',
  ],
  User: [],
};

export function normalizePlatformRole(role?: string | null): PlatformRole {
  const normalized = (role ?? 'User').trim().toLowerCase();
  if (normalized === 'admin') return 'Admin';
  if (normalized === 'moderator' || normalized === 'moderador') return 'Moderator';
  return 'User';
}

export function permissionsForRole(role: PlatformRole): PlatformPermission[] {
  return ROLE_PERMISSIONS[role];
}

export function roleLabelKey(role: PlatformRole): string {
  return `roles.platform.${role.toLowerCase()}`;
}
