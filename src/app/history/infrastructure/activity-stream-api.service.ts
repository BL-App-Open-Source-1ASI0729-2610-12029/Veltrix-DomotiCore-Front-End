import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiClientService } from '../../shared/services/api-client.service';
import { LocalDataCacheService } from '../../shared/services/local-data-cache.service';
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
  private readonly http = inject(HttpClient);
  private readonly cache = inject(LocalDataCacheService);

  getEntries(): Observable<ActivityStreamEntry[]> {
    if (this.api.hasApi()) {
      return this.http
        .get<ActivityStreamEntryResponse[]>(this.apiUrl(STREAMS_FILE))
        .pipe(
          map(remote => this.mergeEntries(remote)),
          catchError(() => this.loadSeedEntries()),
        );
    }

    return this.loadSeedEntries();
  }

  createEntry(entry: ActivityStreamEntry): Observable<ActivityStreamEntry> {
    this.upsertSharedEntry(entry);

    if (this.api.hasApi()) {
      return this.http
        .post<ActivityStreamEntryResponse>(this.apiUrl(STREAMS_FILE), entry)
        .pipe(
          map(mapActivityEntry),
          tap(saved => this.upsertSharedEntry(saved)),
          catchError(() => of(entry)),
        );
    }

    return of(entry);
  }

  updateEntry(entry: ActivityStreamEntry): Observable<ActivityStreamEntry> {
    this.upsertSharedEntry(entry);

    if (this.api.hasApi()) {
      return this.http
        .patch<ActivityStreamEntryResponse>(`${this.apiUrl(STREAMS_FILE)}/${entry.id}`, entry)
        .pipe(
          map(mapActivityEntry),
          tap(saved => this.upsertSharedEntry(saved)),
          catchError(() => of(entry)),
        );
    }

    return of(entry);
  }

  deleteEntry(id: string): Observable<void> {
    this.removeSharedEntry(id);

    if (this.api.hasApi()) {
      return this.http.delete<void>(`${this.apiUrl(STREAMS_FILE)}/${id}`).pipe(
        catchError(() => of(void 0)),
      );
    }

    return of(void 0);
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

  private loadSeedEntries(): Observable<ActivityStreamEntry[]> {
    const shared = this.getSharedEntries();
    if (shared.length) {
      return of(shared);
    }

    return this.http.get<ActivityStreamEntryResponse[]>(`/mock-data/${STREAMS_FILE}.json`).pipe(
      map(remote => this.mergeEntries(remote)),
      tap(entries => this.cache.setSharedCollection(STREAMS_FILE, entries)),
    );
  }

  private mergeEntries(remote: ActivityStreamEntryResponse[]): ActivityStreamEntry[] {
    const byId = new Map<string, ActivityStreamEntry>();

    remote.map(mapActivityEntry).forEach(entry => byId.set(entry.id, entry));
    this.getSharedEntries().forEach(entry => byId.set(entry.id, entry));

    return Array.from(byId.values()).sort(
      (left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
    );
  }

  private getSharedEntries(): ActivityStreamEntry[] {
    return (this.cache.getSharedCollection<ActivityStreamEntry>(STREAMS_FILE) ?? []).map(entry => ({ ...entry }));
  }

  private upsertSharedEntry(entry: ActivityStreamEntry): void {
    const next = [
      ...this.getSharedEntries().filter(item => item.id !== entry.id),
      { ...entry },
    ].sort(
      (left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
    );
    this.cache.setSharedCollection(STREAMS_FILE, next);
  }

  private removeSharedEntry(id: string): void {
    const next = this.getSharedEntries().filter(item => item.id !== id);
    this.cache.setSharedCollection(STREAMS_FILE, next);
  }

  private apiUrl(path: string): string {
    const base = environment.apiUrl.replace(/\/$/, '');
    const clean = path.replace(/^\//, '');
    return `${base}/${clean}`;
  }
}
