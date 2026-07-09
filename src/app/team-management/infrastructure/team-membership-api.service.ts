import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiClientService } from '../../shared/services/api-client.service';
import { LocalDataCacheService } from '../../shared/services/local-data-cache.service';
import { TeamMemberRole } from './team-management-response';

export interface TeamMembershipRecord {
  invitationId: string;
  inviterUserId: number;
  inviterName: string;
  inviterSegment?: string;
  teamRole: TeamMemberRole;
  zones: string[];
  status: 'active' | 'declined';
}

export interface TeamMembershipSnapshot {
  memberships: TeamMembershipRecord[];
}

const MEMBERSHIP_KEY = 'team-membership';

@Injectable({ providedIn: 'root' })
export class TeamMembershipApiService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiClientService);
  private readonly cache = inject(LocalDataCacheService);

  getMine(): Observable<TeamMembershipSnapshot> {
    if (!this.api.hasApi()) {
      return of(this.readLocal());
    }

    return this.http.get<TeamMembershipSnapshot>(this.apiUrl('team-membership/mine')).pipe(
      tap(snapshot => this.cache.setObject(MEMBERSHIP_KEY, snapshot)),
      catchError(() => of(this.readLocal())),
    );
  }

  private readLocal(): TeamMembershipSnapshot {
    return this.cache.getObject<TeamMembershipSnapshot>(MEMBERSHIP_KEY) ?? { memberships: [] };
  }

  private apiUrl(path: string): string {
    const base = environment.apiUrl.replace(/\/$/, '');
    const clean = path.replace(/^\//, '');
    return `${base}/${clean}`;
  }
}
