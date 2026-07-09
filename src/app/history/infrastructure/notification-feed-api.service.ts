import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import {
  DEFAULT_HISTORY_INSIGHTS,
  DEFAULT_NOTIFICATION_FEED,
} from '../application/notification-feed.defaults';
import { ApiClientService } from '../../shared/services/api-client.service';
import {
  HistoryInsights,
  NotificationFeedItem,
  mapHistoryInsights,
  mapNotificationFeedItem,
} from '../domain/model/notification-feed.entity';
import {
  HistoryInsightsResponse,
  NotificationFeedItemResponse,
} from './notification-feed-response';

const FEED_FILE = 'notification-feed';
const INSIGHTS_FILE = 'history-insights';
const INSIGHTS_ID = 1;

@Injectable({ providedIn: 'root' })
export class NotificationFeedApiService {
  private readonly api = inject(ApiClientService);

  getFeedItems(): Observable<NotificationFeedItem[]> {
    return this.api
      .getCollection<NotificationFeedItemResponse>(FEED_FILE, FEED_FILE)
      .pipe(
        timeout(5000),
        map(items => items.map(mapNotificationFeedItem)),
        catchError(() => of([...DEFAULT_NOTIFICATION_FEED])),
      );
  }

  updateFeedItem(item: NotificationFeedItem): Observable<NotificationFeedItem> {
    return this.api
      .patchInCollection<NotificationFeedItemResponse>(
        FEED_FILE,
        item.id,
        item,
        FEED_FILE,
      )
      .pipe(map(mapNotificationFeedItem));
  }

  getInsights(): Observable<HistoryInsights> {
    return this.api
      .getSingleton<HistoryInsightsResponse>(INSIGHTS_FILE, INSIGHTS_ID, INSIGHTS_FILE)
      .pipe(
        timeout(5000),
        map(mapHistoryInsights),
        catchError(() => of(DEFAULT_HISTORY_INSIGHTS)),
      );
  }

  deleteFeedItem(id: string): Observable<void> {
    return this.api.deleteFromCollection(FEED_FILE, id, FEED_FILE);
  }
}
