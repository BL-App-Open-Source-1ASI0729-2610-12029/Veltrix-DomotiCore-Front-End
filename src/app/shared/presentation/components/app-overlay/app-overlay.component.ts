import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../iam/application/auth.service';
import { TeamInvitationService } from '../../../../team-management/application/team-invitation.service';
import { GOOGLE_ICONS } from '../../../constants/google-icons';
import { AppNotification, UiFeedbackService } from '../../../services/ui-feedback.service';
import { MATERIAL_IMPORTS } from '../../../material';

@Component({
  selector: 'app-overlay',
  standalone: true,
  imports: [CommonModule, TranslateModule, ...MATERIAL_IMPORTS],
  template: `
    <div class="panel-backdrop" *ngIf="feedback.notificationsOpen()" (click)="feedback.closeNotifications()">
      <mat-card class="notifications-panel content-card" (click)="$event.stopPropagation()">
        <mat-card-header class="panel-header">
          <mat-card-title>{{ 'overlay.notifications' | translate }}</mat-card-title>
          <button type="button" mat-icon-button (click)="feedback.closeNotifications()" [attr.aria-label]="'common.close' | translate">
            ×
          </button>
        </mat-card-header>
        <mat-card-content>
          <button type="button" mat-button class="panel-action" (click)="feedback.markAllNotificationsRead()">
            {{ 'overlay.markAllRead' | translate }}
          </button>
          <div class="notification-list">
            <article
              *ngFor="let item of feedback.notifications()"
              class="notification-item"
              [class.notification-item--unread]="!item.read"
            >
              <strong>{{ item.titleKey | translate }}</strong>
              <p>{{ item.messageKey | translate:item.messageParams }}</p>
              <small>{{ item.timeKey | translate }}</small>
              <div class="notification-actions" *ngIf="item.invitationId">
                <button type="button" mat-flat-button color="primary" (click)="onAccept(item)">
                  {{ 'teamManagement.notifications.invite.accept' | translate }}
                </button>
                <button type="button" mat-stroked-button (click)="onDecline(item)">
                  {{ 'teamManagement.notifications.invite.decline' | translate }}
                </button>
              </div>
              <button
                *ngIf="!item.invitationId"
                type="button"
                mat-button
                class="notification-mark-read"
                (click)="onNotificationClick(item)"
              >
                {{ 'overlay.markRead' | translate }}
              </button>
            </article>
            <p class="notification-empty" *ngIf="!feedback.notifications().length">
              {{ 'overlay.noNotifications' | translate }}
            </p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <div class="panel-backdrop" *ngIf="feedback.helpOpen()" (click)="feedback.closeHelp()">
      <mat-card class="help-dialog content-card" (click)="$event.stopPropagation()">
        <mat-card-header class="panel-header">
          <mat-card-title>{{ 'overlay.helpCenter' | translate }}</mat-card-title>
          <button type="button" mat-icon-button (click)="feedback.closeHelp()" [attr.aria-label]="'common.close' | translate">
            ×
          </button>
        </mat-card-header>
        <mat-card-content>
          <p class="help-intro">{{ getHelpIntro() }}</p>
          <ul class="help-topics">
            <li *ngFor="let topic of helpTopics">
              <strong>{{ topic.titleKey | translate }}</strong>
              <span>{{ topic.descriptionKey | translate }}</span>
            </li>
          </ul>
          <button type="button" mat-flat-button color="primary" class="full-width" (click)="feedback.closeHelp()">
            {{ 'overlay.gotIt' | translate }}
          </button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .full-width { width: 100%; }

    .panel-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(3px);
      z-index: 1100;
      display: flex;
      align-items: flex-start;
      justify-content: flex-end;
      padding: 88px 1.25rem 1.25rem;
    }

    .notifications-panel,
    .help-dialog {
      width: min(100%, 380px);
      animation: slideIn 0.25s ease;
    }

    .help-dialog {
      margin: 0 auto;
      align-self: center;
      width: min(100%, 520px);
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0;
    }

    .panel-header mat-card-title {
      margin: 0;
      font-size: 1.1rem;
    }

    .panel-action {
      margin-bottom: 0.75rem;
    }

    .notification-list {
      display: grid;
      gap: 0.65rem;
      max-height: 360px;
      overflow-y: auto;
    }

    .notification-item {
      padding: 0.85rem;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }

    .notification-item--unread {
      background: #eef2ff;
      border-color: #c7d2fe;
    }

    .notification-item strong {
      display: block;
      color: #111827;
      margin-bottom: 0.25rem;
    }

    .notification-item p,
    .notification-item small {
      margin: 0;
      color: #6b7280;
      font-size: 0.85rem;
    }

    .notification-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.75rem;
      flex-wrap: wrap;
    }

    .notification-mark-read {
      margin-top: 0.5rem;
      padding: 0;
    }

    .notification-empty {
      color: #6b7280;
      text-align: center;
      margin: 1rem 0 0;
      font-size: 0.9rem;
    }

    .help-intro {
      color: #4b5563;
      line-height: 1.6;
      margin: 0 0 1rem;
    }

    .help-topics {
      list-style: none;
      padding: 0;
      margin: 0 0 1.25rem;
      display: grid;
      gap: 0.75rem;
    }

    .help-topics li {
      display: grid;
      gap: 0.2rem;
      padding: 0.85rem;
      border-radius: 12px;
      background: #f8fafc;
      border: 1px solid #e5e7eb;
    }

    .help-topics strong {
      color: #111827;
    }

    .help-topics span {
      color: #6b7280;
      font-size: 0.9rem;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    :root[data-theme='dark'] .notification-item {
      border-color: rgba(255, 255, 255, 0.08);
      background: var(--surface-soft);
    }

    :root[data-theme='dark'] .notification-item--unread {
      background: rgba(41, 73, 199, 0.1);
      border-color: rgba(41, 73, 199, 0.2);
    }

    :root[data-theme='dark'] .notification-item strong {
      color: var(--gray-100);
    }

    :root[data-theme='dark'] .notification-item p,
    :root[data-theme='dark'] .notification-item small,
    :root[data-theme='dark'] .notification-empty {
      color: var(--gray-400);
    }

    :root[data-theme='dark'] .help-intro {
      color: var(--gray-300);
    }

    :root[data-theme='dark'] .help-topics li {
      background: var(--surface-soft);
      border-color: rgba(255, 255, 255, 0.08);
    }

    :root[data-theme='dark'] .help-topics strong {
      color: var(--gray-100);
    }

    :root[data-theme='dark'] .help-topics span {
      color: var(--gray-400);
    }

    @media (max-width: 640px) {
      .panel-backdrop {
        padding: 72px 0 0;
        align-items: stretch;
        justify-content: stretch;
      }

      .notifications-panel {
        width: 100%;
        max-width: none;
        height: 100%;
        border-radius: 0;
      }

      .help-dialog {
        width: calc(100% - 2rem);
        margin: auto 1rem;
        max-height: calc(100vh - 6rem);
        overflow-y: auto;
      }
    }
  `]
})
export class AppOverlayComponent {
  readonly feedback = inject(UiFeedbackService);
  readonly icons = GOOGLE_ICONS;
  private readonly translate = inject(TranslateService);
  private readonly teamInvitations = inject(TeamInvitationService);
  private readonly auth = inject(AuthService);

  onNotificationClick(item: AppNotification): void {
    this.feedback.markNotificationRead(item.id);
    if (item.invitationId) {
      this.teamInvitations.markInvitationRead(item.invitationId);
    }
  }

  onAccept(item: AppNotification): void {
    if (!item.invitationId) return;
    this.teamInvitations.acceptInvitation(item.invitationId, this.auth.currentUser);
    this.feedback.markNotificationRead(item.id);
  }

  onDecline(item: AppNotification): void {
    if (!item.invitationId) return;
    this.teamInvitations.declineInvitation(item.invitationId, this.auth.currentUser);
    this.feedback.markNotificationRead(item.id);
  }

  readonly helpTopics = [
    { titleKey: 'overlay.helpTopics.dashboard.title', descriptionKey: 'overlay.helpTopics.dashboard.description' },
    { titleKey: 'overlay.helpTopics.devices.title', descriptionKey: 'overlay.helpTopics.devices.description' },
    { titleKey: 'overlay.helpTopics.automation.title', descriptionKey: 'overlay.helpTopics.automation.description' },
    { titleKey: 'overlay.helpTopics.integrations.title', descriptionKey: 'overlay.helpTopics.integrations.description' },
  ];

  getHelpIntro(): string {
    const topic = this.feedback.helpTopic();
    const key = `overlay.helpIntro.${topic}`;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : this.translate.instant('overlay.helpIntro.general');
  }
}
