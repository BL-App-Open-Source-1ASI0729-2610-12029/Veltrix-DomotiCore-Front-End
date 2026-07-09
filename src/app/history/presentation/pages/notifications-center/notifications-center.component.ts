import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NotificationFeedStore } from '../../../application/notification-feed.store';
import {
  GroupedNotificationFeed,
  NotificationAction,
  NotificationFeedItem,
} from '../../../domain/model/notification-feed.entity';
import { NotificationSeverity } from '../../../infrastructure/notification-feed-response';
import { GOOGLE_ICONS, GoogleIconKey } from '../../../../shared/constants/google-icons';
import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';
import { HistoryNavComponent } from '../../components/history-nav/history-nav.component';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

type FeedSectionKey = keyof GroupedNotificationFeed;

const DETAIL_ROUTES: Record<string, string[]> = {
  'nf-1': ['/app/history/energy'],
  'nf-2': ['/app/automation/center'],
  'nf-3': ['/app/devices'],
  'nf-4': ['/app/smart-integrations/connected-services'],
  'nf-5': ['/app/security'],
};

@Component({
  standalone: true,
  imports: [CommonModule, TranslateModule, HistoryNavComponent, ...MATERIAL_IMPORTS],
  templateUrl: './notifications-center.component.html',
  styleUrl: './notifications-center.component.css',
})
export class NotificationsCenterComponent implements OnInit {
  readonly store = inject(NotificationFeedStore);
  private readonly feedback = inject(UiFeedbackService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly icons = GOOGLE_ICONS;
  readonly severityFilters: (NotificationSeverity | 'all')[] = [
    'all', 'critical', 'info', 'success', 'warning', 'security',
  ];

  readonly sections: { key: FeedSectionKey; labelKey: string }[] = [
    { key: 'new', labelKey: 'historyNotifications.sections.new' },
    { key: 'earlierToday', labelKey: 'historyNotifications.sections.earlierToday' },
    { key: 'yesterday', labelKey: 'historyNotifications.sections.yesterday' },
  ];

  showFilterPanel = false;

  ngOnInit(): void {
    this.store.loadAll();
    this.route.queryParams.subscribe(params => {
      const query = params['q'];
      if (typeof query === 'string' && query.trim()) {
        this.store.setSearchQuery(query.trim());
      } else {
        this.store.setSearchQuery('');
      }
    });
  }

  clearFilters(): void {
    this.store.clearFilters();
  }

  hasActiveFilters(): boolean {
    return this.store.hasActiveFilters();
  }

  onSearch(event: Event): void {
    this.store.setSearchQuery((event.target as HTMLInputElement).value);
  }

  toggleFilterPanel(): void {
    this.showFilterPanel = !this.showFilterPanel;
  }

  setSeverityFilter(severity: NotificationSeverity | 'all'): void {
    this.store.setSeverityFilter(severity);
  }

  markAllRead(): void {
    this.store.markAllRead();
    this.feedback.showToast(this.translate.instant('historyNotifications.toast.allRead'), 'success');
  }

  getSectionItems(key: FeedSectionKey): NotificationFeedItem[] {
    return this.store.groupedFeed()[key];
  }

  getItemIcon(iconKey: string): string {
    return GOOGLE_ICONS[iconKey as GoogleIconKey] ?? GOOGLE_ICONS.info;
  }

  getSeverityClass(severity: NotificationSeverity): string {
    return `feed-card__icon--${severity}`;
  }

  onAction(item: NotificationFeedItem, action: NotificationAction): void {
    if (action.id === 'view') {
      this.store.markAsRead(item.id);
      const route = DETAIL_ROUTES[item.id] ?? ['/app/history/activity'];
      this.router.navigate(route);
      return;
    }

    if (action.id === 'mute') {
      this.store.markAsRead(item.id);
      this.store.muteCircuit(item.id);
      this.feedback.showToast(this.translate.instant('historyNotifications.toast.circuitMuted'), 'success');
      return;
    }

    if (action.id === 'dismiss') {
      this.store.dismissItem(item.id);
      this.feedback.showToast(this.translate.instant('historyNotifications.toast.dismissed'), 'info');
      return;
    }

    if (action.id === 'shop') {
      this.store.markAsRead(item.id);
      this.router.navigate(['/app/smart-integrations/connected-services'], {
        queryParams: { order: 'battery' },
      });
      this.feedback.showToast(this.translate.instant('historyNotifications.toast.openingStore'), 'info');
    }
  }

  storageRingOffset(percent: number): number {
    const circumference = 2 * Math.PI * 42;
    return circumference - (percent / 100) * circumference;
  }
}
