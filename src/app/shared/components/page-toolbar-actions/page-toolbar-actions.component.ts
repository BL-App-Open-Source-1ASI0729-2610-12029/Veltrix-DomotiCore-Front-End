import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { GOOGLE_ICONS } from '../../constants/google-icons';
import { UiFeedbackService } from '../../services/ui-feedback.service';
import { MATERIAL_IMPORTS } from '../../material';

@Component({
  selector: 'app-page-toolbar-actions',
  standalone: true,
  imports: [CommonModule, TranslateModule, ...MATERIAL_IMPORTS],
  template: `
    <button
      type="button"
      mat-icon-button
      class="toolbar-btn"
      [matBadge]="unreadCount > 0 ? unreadCount : null"
      matBadgeColor="warn"
      matBadgeSize="small"
      [matBadgeHidden]="unreadCount === 0"
      [title]="'overlay.notifications' | translate"
      (click)="openNotifications()">
      <img [src]="icons.notifications" alt="" class="ui-icon ui-icon--sm" />
    </button>
    <button
      type="button"
      mat-icon-button
      class="toolbar-btn"
      [title]="'overlay.helpCenter' | translate"
      (click)="openHelp()">
      <img [src]="icons.help" alt="" class="ui-icon ui-icon--sm" />
    </button>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .toolbar-btn {
      border: 1px solid #e5e7eb;
      border-radius: 10px;
    }

    :root[data-theme='dark'] .toolbar-btn {
      border-color: rgba(255, 255, 255, 0.1);
    }
  `]
})
export class PageToolbarActionsComponent {
  @Input() helpTopic = 'general';

  readonly icons = GOOGLE_ICONS;
  private readonly feedback = inject(UiFeedbackService);

  get unreadCount(): number {
    return this.feedback.unreadCount();
  }

  openNotifications(): void {
    this.feedback.toggleNotifications();
  }

  openHelp(): void {
    this.feedback.openHelp(this.helpTopic);
  }
}
