import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UiFeedbackService } from '../../shared/services/ui-feedback.service';
import { TeamMemberRole } from '../infrastructure/team-management-response';
import {
  TeamInvitationApiService,
  TeamInvitationRecord,
  TeamInvitationType,
} from '../infrastructure/team-invitation-api.service';
import { TeamMembershipService } from './team-membership.service';

export interface InvitationUserContext {
  id: string | number;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class TeamInvitationService {
  private readonly invitationsApi = inject(TeamInvitationApiService);
  private readonly feedback = inject(UiFeedbackService);
  private readonly membership = inject(TeamMembershipService);
  private readonly translate = inject(TranslateService);

  private readonly seenInvitationIds = new Set<string>();
  private pollTimer: ReturnType<typeof setInterval> | null = null;

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
    this.invitationsApi.sendInvitation(payload).subscribe();
  }

  startPolling(user: InvitationUserContext | null | undefined): void {
    this.stopPolling();
    if (!user?.email) return;

    this.syncForCurrentUser(user);
    this.pollTimer = setInterval(() => this.syncForCurrentUser(user), 60_000);
  }

  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  syncForCurrentUser(user: InvitationUserContext | null | undefined): void {
    if (!user?.email) return;

    this.invitationsApi.listMine().subscribe({
      next: invitations => this.pushNotifications(invitations, user),
    });
  }

  markInvitationRead(invitationId: string): void {
    this.invitationsApi.markRead(invitationId).subscribe();
  }

  acceptInvitation(invitationId: string, user: InvitationUserContext | null | undefined): void {
    this.invitationsApi.accept(invitationId).subscribe({
      next: () => {
        this.membership.sync();
        this.syncForCurrentUser(user);
        this.feedback.showToast(
          this.translate.instant('teamManagement.toast.inviteAccepted'),
          'success',
        );
      },
      error: () => {
        this.feedback.showToast(
          this.translate.instant('teamManagement.toast.inviteAcceptFailed'),
          'error',
        );
      },
    });
  }

  declineInvitation(invitationId: string, user: InvitationUserContext | null | undefined): void {
    this.invitationsApi.decline(invitationId).subscribe({
      next: () => {
        this.syncForCurrentUser(user);
        this.feedback.showToast(
          this.translate.instant('teamManagement.toast.inviteDeclined'),
          'info',
        );
      },
    });
  }

  private pushNotifications(
    invitations: TeamInvitationRecord[],
    user: InvitationUserContext,
  ): void {
    const mine = invitations.filter(
      invitation =>
        invitation.status === 'pending' &&
        (invitation.recipientEmail === user.email.toLowerCase() ||
          (invitation.recipientUserId != null &&
            String(invitation.recipientUserId) === String(user.id))),
    );

    mine.forEach(invitation => {
      const notificationId = this.notificationId(invitation.id);
      const isNew = !this.seenInvitationIds.has(invitation.id);

      this.feedback.addUserNotification({
        id: notificationId,
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
        invitationId: invitation.id,
      });

      if (isNew && !invitation.read) {
        this.seenInvitationIds.add(invitation.id);
        this.feedback.showToast(
          this.translate.instant('teamManagement.notifications.invite.toast', {
            inviter: invitation.inviterName,
            role: this.roleLabel(invitation.role),
          }),
          'info',
          5000,
        );
      }
    });

    const pendingIds = new Set(mine.map(item => item.id));
    this.feedback.notifications().forEach(item => {
      if (item.invitationId && !pendingIds.has(item.invitationId)) {
        this.feedback.removeNotification(item.id);
      }
    });
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
