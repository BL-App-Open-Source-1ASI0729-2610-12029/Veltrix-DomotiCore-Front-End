import { Injectable, computed, inject, signal } from '@angular/core';
import { AlertsHistoryApiService } from '../infrastructure/alerts-history-api.service';
import {
  AlertEventStatus,
  AlertLogTab,
  AlertsHistoryResponse,
} from '../infrastructure/alerts-history-response';

export type AlertsFilterKey = 'all' | 'critical' | 'last24h' | 'unresolved';

@Injectable({ providedIn: 'root' })
export class AlertsHistoryStore {
  private readonly api = inject(AlertsHistoryApiService);

  readonly data = signal<AlertsHistoryResponse | null>(null);
  readonly loading = signal(false);
  readonly activeTab = signal<AlertLogTab>('all');
  readonly activeFilter = signal<AlertsFilterKey>('all');
  readonly currentPage = signal(1);
  readonly showFiltersMenu = signal(false);
  readonly openEntryMenuId = signal<string | null>(null);
  readonly contentAnimKey = signal(0);

  readonly filteredEntries = computed(() => {
    const payload = this.data();
    if (!payload) return [];

    const tab = this.activeTab();
    const filter = this.activeFilter();

    return payload.entries.filter(entry => {
      const matchesTab =
        tab === 'all' ||
        (tab === 'alerts' && entry.category === 'alert') ||
        (tab === 'manual' && entry.category === 'manual');

      if (!matchesTab) return false;

      if (filter === 'critical') return entry.priority === 'critical';
      if (filter === 'unresolved') return entry.status === 'unresolved';
      if (filter === 'last24h') return entry.timestamp.startsWith('Today');
      return true;
    });
  });

  readonly pagedEntries = computed(() => {
    const payload = this.data();
    if (!payload) return [];

    const start = (this.currentPage() - 1) * payload.pageSize;
    return this.filteredEntries().slice(start, start + payload.pageSize);
  });

  readonly totalPages = computed(() => {
    const payload = this.data();
    if (!payload) return 1;
    const total = this.filteredEntries().length;
    return Math.max(1, Math.ceil(total / payload.pageSize));
  });

  readonly visibleRecordCount = computed(() => this.filteredEntries().length);

  load(): void {
    this.loading.set(true);
    this.api.getAlertsHistory().subscribe({
      next: payload => {
        this.data.set(payload);
        this.currentPage.set(1);
        this.contentAnimKey.update(key => key + 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setTab(tab: AlertLogTab): void {
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.contentAnimKey.update(key => key + 1);
  }

  setFilter(filter: AlertsFilterKey): void {
    this.activeFilter.set(filter);
    this.currentPage.set(1);
    this.closeFiltersMenu();
    this.contentAnimKey.update(key => key + 1);
  }

  goToPage(page: number): void {
    const total = this.totalPages();
    if (page < 1 || page > total) return;
    this.currentPage.set(page);
    this.contentAnimKey.update(key => key + 1);
  }

  toggleFiltersMenu(): void {
    this.showFiltersMenu.update(open => !open);
  }

  closeFiltersMenu(): void {
    this.showFiltersMenu.set(false);
  }

  toggleEntryMenu(entryId: string): void {
    this.openEntryMenuId.update(current => (current === entryId ? null : entryId));
  }

  closeEntryMenu(): void {
    this.openEntryMenuId.set(null);
  }

  updateEntryStatus(entryId: string, status: AlertEventStatus): void {
    this.data.update(payload => {
      if (!payload) return payload;

      const entries = payload.entries.map(entry =>
        entry.id === entryId ? { ...entry, status } : entry,
      );

      const unresolved = entries.filter(entry => entry.status === 'unresolved').length;
      const resolvedCount = entries.length - unresolved;
      const resolutionPercent = Math.round((resolvedCount / entries.length) * 100);

      return {
        ...payload,
        entries,
        summary: {
          ...payload.summary,
          resolutionPercent,
        },
      };
    });
    this.closeEntryMenu();
  }
}
