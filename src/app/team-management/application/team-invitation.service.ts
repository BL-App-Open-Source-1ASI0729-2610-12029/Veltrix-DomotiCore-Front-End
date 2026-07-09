import { Injectable, inject } from '@angular/core';
import { AuthService } from '../../iam/application/auth.service';
import { LocalDataCacheService } from '../../shared/services/local-data-cache.service';
import { UiFeedbackService } from '../../shared/services/ui-feedback.service';
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

const INVITATIONS_KEY = 'team-invitations';

@Injectable({ providedIn: 'root' })
export class TeamInvitationService {
  private readonly cache = inject(LocalDataCacheService);
  private readonly feedback = inject(UiFeedbackService);
  private readonly auth = inject(AuthService);

  sendInvitation(payload: {
    recipientUserId?: string | number;
    recipientEmail: string;
    memberName: string;
    role: TeamMemberRole;
    zones: string[];
    inviterName: string;
    inviterEmail: string;
    type?: TeamInvitationType;
  }): void {
    const record: TeamInvitationRecord = {
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

    const next = [record, ...(this.cache.getSharedCollection<TeamInvitationRecord>(INVITATIONS_KEY) ?? [])];
    this.cache.setSharedCollection(INVITATIONS_KEY, next);
    this.syncForCurrentUser();
  }

  syncForCurrentUser(): void {
    const user = this.auth.currentUser;
    if (!user?.email) return;

    const invitations = (this.cache.getSharedCollection<TeamInvitationRecord>(INVITATIONS_KEY) ?? []).filter(
      invitation =>
        invitation.recipientEmail === user.email.toLowerCase() ||
        (invitation.recipientUserId != null && String(invitation.recipientUserId) === String(user.id)),
    );

    invitations.forEach(invitation => {
      this.feedback.addUserNotification({
        id: this.notificationId(invitation.id),
        titleKey: 'teamManagement.notifications.invite.title',
        messageKey:
          invitation.type === 'team_invite_resent'
            ? 'teamManagement.notifications.invite.resent'
            : 'teamManagement.notifications.invite.message',
        messageParams: {
          inviter: invitation.inviterName,
          role: this.roleLabel(invitation.role),
          zones: invitation.zones.join(', '),
        },
        timeKey: 'teamManagement.notifications.invite.time',
        read: invitation.read,
      });
    });
  }

  markInvitationRead(invitationId: string): void {
    const next = (this.cache.getSharedCollection<TeamInvitationRecord>(INVITATIONS_KEY) ?? []).map(invitation =>
      invitation.id === invitationId ? { ...invitation, read: true } : invitation,
    );
    this.cache.setSharedCollection(INVITATIONS_KEY, next);
  }

  private notificationId(seed: string): number {
    let hash = 0;
    for (let index = 0; index < seed.length; index += 1) {
      hash = (hash * 31 + seed.charCodeAt(index)) % 1_000_000_000;
    }
    return hash + 10_000;
  }

  private roleLabel(role: TeamMemberRole): string {
    const labels: Record<TeamMemberRole, string> = {
      administrator: 'Administrator',
      manager: 'Manager',
      viewer: 'Viewer',
    };
    return labels[role];
  }
}
