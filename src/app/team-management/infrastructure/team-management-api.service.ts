import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, delay, tap } from 'rxjs/operators';
import { ApiClientService } from '../../shared/services/api-client.service';
import { LocalDataCacheService } from '../../shared/services/local-data-cache.service';
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
  private readonly cache = inject(LocalDataCacheService);

  getTeamManagement(): Observable<TeamManagementResponse> {
    const shared = this.cache.getSharedObject<TeamManagementResponse>(TEAM_FILE);
    if (shared) {
      return of(structuredClone(shared));
    }

    if (this.api.hasApi()) {
      return this.api.getObject<TeamManagementResponse>(TEAM_FILE, TEAM_FILE).pipe(
        tap(data => this.cache.setSharedObject(TEAM_FILE, data)),
        catchError(() => this.seedTeam()),
      );
    }

    return this.seedTeam();
  }

  updateTeamManagement(payload: TeamManagementResponse): Observable<TeamManagementResponse> {
    this.cache.setSharedObject(TEAM_FILE, payload);

    if (this.api.hasApi()) {
      return this.api.patchObject<TeamManagementResponse>(TEAM_FILE, payload, TEAM_FILE).pipe(
        tap(saved => this.cache.setSharedObject(TEAM_FILE, saved)),
        catchError(() => of(structuredClone(payload)).pipe(delay(250))),
      );
    }

    return of(structuredClone(payload)).pipe(delay(250));
  }

  private seedTeam(): Observable<TeamManagementResponse> {
    const seeded = structuredClone(MOCK_TEAM);
    this.cache.setSharedObject(TEAM_FILE, seeded);
    return of(seeded).pipe(delay(250));
  }
}
