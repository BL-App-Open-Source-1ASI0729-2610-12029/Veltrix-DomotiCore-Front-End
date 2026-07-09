import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiClientService } from '../../shared/services/api-client.service';
import { LocalDataCacheService } from '../../shared/services/local-data-cache.service';
import { TeamMemberRole } from '../infrastructure/team-management-response';

export type TeamInvitationType = 'team_invite' | 'team_invite_resent';

export interface TeamInvitationRecord {
  id: string;
  recipientUserId?: string | number;
  recipientEmail: string;
  inviterName: string;
  inviterEmail: string;
  memberName: string;
  role: TeamMemberRole;
  zones: string[];
  type: TeamInvitationType;
  createdAt: string;
  read: boolean;
}

interface TeamInvitationApiResponse {
  id: string;
  recipientUserId?: number;
  recipientEmail: string;
  inviterName: string;
  inviterEmail: string;
  memberName: string;
  role: TeamMemberRole;
  zones: string[];
  type: TeamInvitationType;
  createdAt: string;
  read: boolean;
}

const INVITATIONS_KEY = 'team-invitations';

@Injectable({ providedIn: 'root' })
export class TeamInvitationApiService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiClientService);
  private readonly cache = inject(LocalDataCacheService);

  sendInvitation(payload: {
    recipientUserId?: string | number;
    recipientEmail: string;
    memberName: string;
    role: TeamMemberRole;
    zones: string[];
    inviterName: string;
    inviterEmail: string;
    type?: TeamInvitationType;
  }): Observable<TeamInvitationRecord> {
    const record = this.buildLocalRecord(payload);
    this.upsertLocal(record);

    if (!this.api.hasApi()) {
      return of(record);
    }

    return this.http
      .post<TeamInvitationApiResponse>(this.apiUrl('team-invitations'), {
        recipientUserId: payload.recipientUserId != null ? Number(payload.recipientUserId) : undefined,
        recipientEmail: payload.recipientEmail,
        memberName: payload.memberName,
        role: payload.role,
        zones: payload.zones,
        type: payload.type ?? 'team_invite',
      })
      .pipe(
        map(response => this.mapResponse(response)),
        tap(mapped => this.upsertLocal(mapped)),
        catchError(() => of(record)),
      );
  }

  listMine(): Observable<TeamInvitationRecord[]> {
    if (!this.api.hasApi()) {
      return of(this.readLocal());
    }

    return this.http.get<TeamInvitationApiResponse[]>(this.apiUrl('team-invitations/mine')).pipe(
      map(responses => responses.map(response => this.mapResponse(response))),
      tap(records => this.cache.setSharedCollection(INVITATIONS_KEY, records)),
      catchError(() => of(this.readLocal())),
    );
  }

  markRead(invitationId: string): Observable<void> {
    this.markLocalRead(invitationId);

    if (!this.api.hasApi()) {
      return of(void 0);
    }

    return this.http.patch<void>(`${this.apiUrl('team-invitations')}/${invitationId}/read`, {}).pipe(
      catchError(() => of(void 0)),
    );
  }

  private buildLocalRecord(payload: {
    recipientUserId?: string | number;
    recipientEmail: string;
    memberName: string;
    role: TeamMemberRole;
    zones: string[];
    inviterName: string;
    inviterEmail: string;
    type?: TeamInvitationType;
  }): TeamInvitationRecord {
    return {
      id: `inv-${Date.now()}`,
      recipientUserId: payload.recipientUserId,
      recipientEmail: payload.recipientEmail.trim().toLowerCase(),
      inviterName: payload.inviterName,
      inviterEmail: payload.inviterEmail,
      memberName: payload.memberName,
      role: payload.role,
      zones: payload.zones,
      type: payload.type ?? 'team_invite',
      createdAt: new Date().toISOString(),
      read: false,
    };
  }

  private mapResponse(response: TeamInvitationApiResponse): TeamInvitationRecord {
    return {
      id: response.id,
      recipientUserId: response.recipientUserId,
      recipientEmail: response.recipientEmail,
      inviterName: response.inviterName,
      inviterEmail: response.inviterEmail,
      memberName: response.memberName,
      role: response.role,
      zones: response.zones ?? [],
      type: response.type,
      createdAt: response.createdAt,
      read: response.read,
    };
  }

  private readLocal(): TeamInvitationRecord[] {
    return (this.cache.getSharedCollection<TeamInvitationRecord>(INVITATIONS_KEY) ?? []).map(item => ({ ...item }));
  }

  private upsertLocal(record: TeamInvitationRecord): void {
    const next = [record, ...this.readLocal().filter(item => item.id !== record.id)];
    this.cache.setSharedCollection(INVITATIONS_KEY, next);
  }

  private markLocalRead(invitationId: string): void {
    const next = this.readLocal().map(item =>
      item.id === invitationId ? { ...item, read: true } : item,
    );
    this.cache.setSharedCollection(INVITATIONS_KEY, next);
  }

  private apiUrl(path: string): string {
    const base = environment.apiUrl.replace(/\/$/, '');
    const clean = path.replace(/^\//, '');
    return `${base}/${clean}`;
  }
}
