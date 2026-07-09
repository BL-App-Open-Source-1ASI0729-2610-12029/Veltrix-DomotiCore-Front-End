import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClientService } from '../../shared/services/api-client.service';
import {
  ActivityStreamEntryResponse,
  HistorySummaryResponse,
} from './activity-stream-response';
import { ActivityStreamEntry, HistorySummary, mapActivityEntry, mapHistorySummary } from '../domain/model/activity-stream.entity';

const STREAMS_FILE = 'activity-streams';
const SUMMARY_FILE = 'history-summary';
const SUMMARY_ID = 1;

@Injectable({ providedIn: 'root' })
export class ActivityStreamApiService {
  private readonly api = inject(ApiClientService);

  getEntries(): Observable<ActivityStreamEntry[]> {
    return this.api
      .getCollection<ActivityStreamEntryResponse>(STREAMS_FILE, STREAMS_FILE)
      .pipe(map(entries => entries.map(mapActivityEntry)));
  }

  createEntry(entry: ActivityStreamEntry): Observable<ActivityStreamEntry> {
    return this.api
      .postToCollection(STREAMS_FILE, entry, STREAMS_FILE)
      .pipe(map(mapActivityEntry));
  }

  updateEntry(entry: ActivityStreamEntry): Observable<ActivityStreamEntry> {
    return this.api
      .patchInCollection(STREAMS_FILE, entry.id, entry, STREAMS_FILE)
      .pipe(map(mapActivityEntry));
  }

  deleteEntry(id: string): Observable<void> {
    return this.api.deleteFromCollection(STREAMS_FILE, id, STREAMS_FILE);
  }

  getSummary(): Observable<HistorySummary> {
    return this.api
      .getSingleton<HistorySummaryResponse>(SUMMARY_FILE, SUMMARY_ID, SUMMARY_FILE)
      .pipe(map(mapHistorySummary));
  }

  updateSummary(summary: HistorySummary & { id: number }): Observable<HistorySummary> {
    return this.api
      .patchSingleton(SUMMARY_FILE, SUMMARY_ID, summary, SUMMARY_FILE)
      .pipe(map(mapHistorySummary));
  }
}
