export type TeamMemberRole = 'administrator' | 'manager' | 'viewer';
export type TeamMemberStatus = 'active' | 'offline';
export type TeamMemberTab = 'all' | 'pending' | 'archived';

export interface TeamSummaryResponse {
  totalMembers: number;
  membersTrendCount: number;
  administrators: number;
  administratorsLabelKey: string;
  activeZones: number;
  activeZonesLabelKey: string;
  recentActivity: number;
  recentActivityLabelKey: string;
}

export interface TeamMemberResponse {
  id: string;
  initials: string;
  name: string;
  email: string;
  role: TeamMemberRole;
  zones: string[];
  extraZones?: number;
  status: TeamMemberStatus;
  tab: TeamMemberTab;
}

export interface ZonePermissionResponse {
  zone: string;
  defaultRole: TeamMemberRole;
  enabled: boolean;
}

export interface TeamManagementResponse {
  summary: TeamSummaryResponse;
  members: TeamMemberResponse[];
  totalMembers: number;
  pageSize: number;
  zonePermissions: ZonePermissionResponse[];
}
