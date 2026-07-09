import { Injectable, computed, inject, signal } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { forkJoin, of } from 'rxjs';

import { catchError, map } from 'rxjs/operators';

import {

  GroupedNotificationFeed,

  HistoryInsights,

  NotificationFeedItem,

} from '../domain/model/notification-feed.entity';

import { NotificationFeedApiService } from '../infrastructure/notification-feed-api.service';

import { NotificationSeverity } from '../infrastructure/notification-feed-response';

import {

  DEFAULT_HISTORY_INSIGHTS,

  DEFAULT_NOTIFICATION_FEED,

} from './notification-feed.defaults';



@Injectable({ providedIn: 'root' })

export class NotificationFeedStore {

  private readonly api = inject(NotificationFeedApiService);

  private readonly translate = inject(TranslateService);



  readonly items = signal<NotificationFeedItem[]>([]);

  readonly insights = signal<HistoryInsights | null>(null);

  readonly loading = signal(false);

  readonly searchQuery = signal('');

  readonly severityFilter = signal<NotificationSeverity | 'all'>('all');

  readonly showUnreadOnly = signal(false);

  readonly mutedCircuits = signal<Set<string>>(new Set());



  readonly filteredItems = computed(() => {

    const query = this.searchQuery().trim().toLowerCase();

    const severity = this.severityFilter();

    const unreadOnly = this.showUnreadOnly();



    return this.items().filter(item => {

      if (unreadOnly && item.read) return false;

      if (severity !== 'all' && item.severity !== severity) return false;

      if (!query) return true;



      const title = this.translate.instant(item.titleKey).toLowerCase();

      const description = this.translate.instant(item.descriptionKey).toLowerCase();

      return title.includes(query) || description.includes(query) || item.timeLabel.toLowerCase().includes(query);

    });

  });



  readonly groupedFeed = computed<GroupedNotificationFeed>(() => {

    const filtered = this.filteredItems();

    return {

      new: filtered.filter(item => item.section === 'new'),

      earlierToday: filtered.filter(item => item.section === 'earlier_today'),

      yesterday: filtered.filter(item => item.section === 'yesterday'),

    };

  });



  readonly unreadCount = computed(() => this.items().filter(item => !item.read).length);



  readonly hasActiveFilters = computed(

    () =>

      !!this.searchQuery().trim() ||

      this.severityFilter() !== 'all' ||

      this.showUnreadOnly(),

  );



  loadAll(): void {

    this.loading.set(true);



    forkJoin({

      items: this.api.getFeedItems().pipe(

        map(items => (items.length ? items : [...DEFAULT_NOTIFICATION_FEED])),

        catchError(() => of([...DEFAULT_NOTIFICATION_FEED])),

      ),

      insights: this.api.getInsights().pipe(

        catchError(() => of(DEFAULT_HISTORY_INSIGHTS)),

      ),

    }).subscribe({

      next: ({ items, insights }) => {

        this.items.set(items);

        this.insights.set(insights ?? DEFAULT_HISTORY_INSIGHTS);

        this.loading.set(false);

      },

      error: () => {

        this.items.set([...DEFAULT_NOTIFICATION_FEED]);

        this.insights.set(DEFAULT_HISTORY_INSIGHTS);

        this.loading.set(false);

      },

    });

  }



  clearFilters(): void {

    this.searchQuery.set('');

    this.severityFilter.set('all');

    this.showUnreadOnly.set(false);

  }



  setSearchQuery(query: string): void {

    this.searchQuery.set(query);

  }



  setSeverityFilter(severity: NotificationSeverity | 'all'): void {

    this.severityFilter.set(severity);

  }



  toggleUnreadFilter(): void {

    this.showUnreadOnly.update(value => !value);

  }



  markAllRead(): void {

    const updated = this.items().map(item => ({ ...item, read: true }));

    this.items.set(updated);

    updated.forEach(item => this.api.updateFeedItem(item).subscribe());

  }



  markAsRead(id: string): void {

    const item = this.items().find(entry => entry.id === id);

    if (!item || item.read) return;



    const updated = { ...item, read: true };

    this.items.update(list => list.map(entry => (entry.id === id ? updated : entry)));

    this.api.updateFeedItem(updated).subscribe();

  }



  dismissItem(id: string): void {

    this.items.update(list => list.filter(entry => entry.id !== id));

    this.api.deleteFeedItem(id).subscribe();

  }



  muteCircuit(circuitKey: string): void {

    this.mutedCircuits.update(current => {

      const next = new Set(current);

      next.add(circuitKey);

      return next;

    });

  }



  isCircuitMuted(circuitKey: string): boolean {

    return this.mutedCircuits().has(circuitKey);

  }

}


