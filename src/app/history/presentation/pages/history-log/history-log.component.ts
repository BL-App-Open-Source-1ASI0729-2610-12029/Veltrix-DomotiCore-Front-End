import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ActivityStreamStore } from '../../../application/activity-stream.store';
import { DateRangeFilter } from '../../../domain/model/activity-stream.entity';
import { ActivityAction, ActivityDeviceType, ActivityStatus } from '../../../infrastructure/activity-stream-response';
import { GOOGLE_ICONS, GoogleIconKey } from '../../../../shared/constants/google-icons';
import { HistoryNavComponent } from '../../components/history-nav/history-nav.component';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, HistoryNavComponent, ...MATERIAL_IMPORTS],
  templateUrl: './history-log.component.html',
  styleUrl: './history-log.component.css',
})
export class HistoryLogComponent implements OnInit {
  readonly store = inject(ActivityStreamStore);
  readonly icons = GOOGLE_ICONS;

  readonly dateRanges: DateRangeFilter[] = ['last_24h', 'last_7d', 'last_30d'];
  readonly deviceTypes: (ActivityDeviceType | 'all')[] = [
    'all', 'lighting', 'sensor', 'climate', 'camera', 'appliance',
  ];

  selectedDateRange: DateRangeFilter = 'last_24h';
  selectedDeviceType: ActivityDeviceType | 'all' = 'all';
  openMenuId: string | null = null;
  readonly pendingDeleteId = signal<string | null>(null);

  ngOnInit(): void {
    this.selectedDateRange = this.store.dateRange();
    this.selectedDeviceType = this.store.deviceType();
    this.store.loadAll();
  }

  getIcon(iconKey: string): string {
    return GOOGLE_ICONS[iconKey as GoogleIconKey] ?? GOOGLE_ICONS.deviceHub;
  }

  getActionClass(action: ActivityAction): string {
    const map: Record<ActivityAction, string> = {
      turned_on: 'action-badge--blue',
      turned_off: 'action-badge--gray',
      triggered_alert: 'action-badge--orange',
      scheduled: 'action-badge--purple',
      connection_lost: 'action-badge--red',
      consumption_update: 'action-badge--teal',
    };
    return map[action] ?? 'action-badge--gray';
  }

  getStatusClass(status: ActivityStatus): string {
    return status === 'critical' ? 'status-pill--critical' : status === 'warning' ? 'status-pill--warning' : 'status-pill--success';
  }

  getMaxEventVolume(): number {
    const days = this.store.summary()?.eventVolumeByDay ?? [];
    return Math.max(...days.map(d => d.value), 1);
  }

  onSearch(event: Event): void {
    this.store.setSearchQuery((event.target as HTMLInputElement).value);
  }

  onApplyFilters(): void {
    this.store.setDateRange(this.selectedDateRange);
    this.store.setDeviceType(this.selectedDeviceType);
    this.store.applyFilters();
  }

  onExportCsv(): void {
    const csv = this.store.exportCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'activity-streams.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  toggleMenu(id: string): void {
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  markCritical(id: string): void {
    this.store.updateEntryStatus(id, 'critical');
    this.openMenuId = null;
  }

  markSuccess(id: string): void {
    this.store.updateEntryStatus(id, 'success');
    this.openMenuId = null;
  }

  requestDeleteEntry(id: string): void {
    this.pendingDeleteId.set(id);
    this.openMenuId = null;
  }

  cancelDeleteEntry(): void {
    this.pendingDeleteId.set(null);
  }

  confirmDeleteEntry(): void {
    const id = this.pendingDeleteId();
    if (!id) return;
    this.store.deleteEntry(id);
    this.pendingDeleteId.set(null);
  }

  getAlertIcon(type: string): string {
    return type === 'warning' ? this.icons.campaign : this.icons.lock;
  }
}
