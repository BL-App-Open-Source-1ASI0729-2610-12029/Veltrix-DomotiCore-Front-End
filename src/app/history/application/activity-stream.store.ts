import { Injectable, computed, inject, signal } from '@angular/core';
import {
  ActivityStreamEntry,
  DateRangeFilter,
  HistorySummary,
} from '../domain/model/activity-stream.entity';
import { ActivityDeviceType, ActivityStatus } from '../infrastructure/activity-stream-response';
import { ActivityStreamApiService } from '../infrastructure/activity-stream-api.service';

const PAGE_SIZE = 10;

@Injectable({ providedIn: 'root' })
export class ActivityStreamStore {
  private readonly api = inject(ActivityStreamApiService);

  readonly entries = signal<ActivityStreamEntry[]>([]);
  readonly summary = signal<HistorySummary | null>(null);
  readonly loading = signal(false);
  readonly searchQuery = signal('');
  readonly dateRange = signal<DateRangeFilter>('last_24h');
  readonly deviceType = signal<ActivityDeviceType | 'all'>('all');
  readonly currentPage = signal(1);

  readonly filteredEntries = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const type = this.deviceType();
    const range = this.dateRange();
    const now = Date.now();
    const rangeMs: Record<DateRangeFilter, number> = {
      last_24h: 24 * 60 * 60 * 1000,
      last_7d: 7 * 24 * 60 * 60 * 1000,
      last_30d: 30 * 24 * 60 * 60 * 1000,
    };
    const cutoff = now - rangeMs[range];

    return this.entries()
      .filter(entry => new Date(entry.occurredAt).getTime() >= cutoff)
      .filter(entry => type === 'all' || entry.deviceType === type)
      .filter(entry => {
        if (!query) return true;
        return (
          entry.deviceName.toLowerCase().includes(query) ||
          entry.deviceModel.toLowerCase().includes(query) ||
          entry.actionLabel.toLowerCase().includes(query) ||
          entry.location.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  });

  readonly totalFiltered = computed(() => this.filteredEntries().length);

  readonly paginatedEntries = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * PAGE_SIZE;
    return this.filteredEntries().slice(start, start + PAGE_SIZE);
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalFiltered() / PAGE_SIZE)),
  );

  readonly pageStart = computed(() =>
    this.totalFiltered() === 0 ? 0 : (this.currentPage() - 1) * PAGE_SIZE + 1,
  );

  readonly pageEnd = computed(() =>
    Math.min(this.currentPage() * PAGE_SIZE, this.totalFiltered()),
  );

  loadAll(): void {
    this.loading.set(true);
    this.api.getEntries().subscribe({
      next: entries => {
        this.entries.set(entries);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.api.getSummary().subscribe({
      next: summary => this.summary.set(summary),
    });
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  setDateRange(range: DateRangeFilter): void {
    this.dateRange.set(range);
    this.currentPage.set(1);
  }

  setDeviceType(type: ActivityDeviceType | 'all'): void {
    this.deviceType.set(type);
    this.currentPage.set(1);
  }

  applyFilters(): void {
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    const safe = Math.min(Math.max(1, page), this.totalPages());
    this.currentPage.set(safe);
  }

  updateEntryStatus(id: string, status: ActivityStatus): void {
    const entry = this.entries().find(e => e.id === id);
    if (!entry) return;

    const updated = { ...entry, status };
    this.entries.update(list => list.map(e => (e.id === id ? updated : e)));
    this.api.updateEntry(updated).subscribe();
  }

  deleteEntry(id: string): void {
    this.entries.update(list => list.filter(e => e.id !== id));
    this.api.deleteEntry(id).subscribe();
    this.syncSummaryTotal();
  }

  addEntry(entry: ActivityStreamEntry): void {
    this.entries.update(list => [entry, ...list]);
    this.api.createEntry(entry).subscribe({
      next: saved => {
        this.entries.update(list => list.map(e => (e.id === entry.id ? saved : e)));
        this.syncSummaryTotal();
      },
    });
  }

  private syncSummaryTotal(): void {
    const current = this.summary();
    if (!current) return;

    const updated = {
      id: 1,
      ...current,
      totalEntries: this.entries().length,
    };

    this.summary.set(updated);
    this.api.updateSummary(updated).subscribe();
  }

  exportCsv(): string {
    const headers = ['Time & Date', 'Device', 'Model', 'Action', 'Location', 'Status', 'Consumption kWh'];
    const rows = this.filteredEntries().map(entry => [
      this.formatDateTime(entry.occurredAt),
      entry.deviceName,
      entry.deviceModel,
      entry.actionLabel,
      entry.location,
      entry.status,
      entry.consumptionKwh?.toString() ?? '',
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }

  formatDateTime(iso: string): string {
    const date = new Date(iso);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
