import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, catchError } from 'rxjs/operators';
import { ApiClientService } from '../../shared/services/api-client.service';
import { TeamManagementResponse } from './team-management-response';

const MOCK_TEAM: TeamManagementResponse = {
  summary: {
    totalMembers: 24,
    membersTrendCount: 2,
    administrators: 3,
    administratorsLabelKey: 'teamManagement.summary.administratorsLabel',
    activeZones: 12,
    activeZonesLabelKey: 'teamManagement.summary.activeZonesLabel',
    recentActivity: 156,
    recentActivityLabelKey: 'teamManagement.summary.recentActivityLabel',
  },
  totalMembers: 24,
  pageSize: 4,
  zonePermissions: [
    { zone: 'global', defaultRole: 'administrator', enabled: true },
    { zone: 'mainOffice', defaultRole: 'manager', enabled: true },
    { zone: 'hq', defaultRole: 'manager', enabled: true },
    { zone: 'northWarehouse', defaultRole: 'viewer', enabled: true },
    { zone: 'dataCenter', defaultRole: 'viewer', enabled: true },
    { zone: 'retailFloor', defaultRole: 'manager', enabled: false },
    { zone: 'warehouse', defaultRole: 'viewer', enabled: true },
  ],
  members: [
    {
      id: '1',
      initials: 'SM',
      name: 'Sarah Mitchell',
      email: 'sarah.mitchell@domoticore.io',
      role: 'administrator',
      zones: ['global'],
      status: 'active',
      tab: 'all',
    },
    {
      id: '2',
      initials: 'JR',
      name: 'James Rivera',
      email: 'james.rivera@domoticore.io',
      role: 'manager',
      zones: ['mainOffice', 'hq'],
      status: 'active',
      tab: 'all',
    },
  ],
};

const TEAM_FILE = 'team-management';

@Injectable({ providedIn: 'root' })
export class TeamManagementApiService {
  private readonly api = inject(ApiClientService);

  getTeamManagement(): Observable<TeamManagementResponse> {
    return this.api.getObject<TeamManagementResponse>(TEAM_FILE, TEAM_FILE).pipe(
      catchError(() => of(structuredClone(MOCK_TEAM)).pipe(delay(250))),
    );
  }

  updateTeamManagement(payload: TeamManagementResponse): Observable<TeamManagementResponse> {
    return this.api.patchObject<TeamManagementResponse>(TEAM_FILE, payload, TEAM_FILE).pipe(
      catchError(() => of(structuredClone(payload)).pipe(delay(250))),
    );
  }
}
