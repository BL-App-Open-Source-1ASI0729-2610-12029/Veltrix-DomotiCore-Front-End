import { Injectable, inject } from '@angular/core';

import { UiFeedbackService } from '../../shared/services/ui-feedback.service';

import { TeamMemberRole } from '../infrastructure/team-management-response';

import {

  TeamInvitationApiService,

  TeamInvitationRecord,

  TeamInvitationType,

} from '../infrastructure/team-invitation-api.service';



export interface InvitationUserContext {

  id: string | number;

  email: string;

}



@Injectable({ providedIn: 'root' })

export class TeamInvitationService {

  private readonly invitationsApi = inject(TeamInvitationApiService);

  private readonly feedback = inject(UiFeedbackService);



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



  syncForCurrentUser(user: InvitationUserContext | null | undefined): void {

    if (!user?.email) return;



    this.invitationsApi.listMine().subscribe({

      next: invitations => this.pushNotifications(invitations, user),

    });

  }



  markInvitationRead(invitationId: string): void {

    this.invitationsApi.markRead(invitationId).subscribe();

  }



  private pushNotifications(

    invitations: TeamInvitationRecord[],

    user: InvitationUserContext,

  ): void {

    const mine = invitations.filter(

      invitation =>

        invitation.recipientEmail === user.email.toLowerCase() ||

        (invitation.recipientUserId != null &&

          String(invitation.recipientUserId) === String(user.id)),

    );



    mine.forEach(invitation => {

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

        invitationId: invitation.id,

      });

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


