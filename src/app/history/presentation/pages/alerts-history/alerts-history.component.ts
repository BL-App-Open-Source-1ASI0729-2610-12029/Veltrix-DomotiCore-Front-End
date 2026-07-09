import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AlertsFilterKey, AlertsHistoryStore } from '../../../application/alerts-history.store';
import {
  AlertEventStatus,
  AlertLogEntryResponse,
  AlertLogTab,
  AlertPriority,
} from '../../../infrastructure/alerts-history-response';
import { BusinessReportsNavComponent } from '../../components/business-reports-nav/business-reports-nav.component';
import { GOOGLE_ICONS, GoogleIconKey } from '../../../../shared/constants/google-icons';
import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';
import { downloadCsvFile } from '../../../../shared/utils/download-file.util';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

@Component({
  selector: 'app-alerts-history',
  standalone: true,
  imports: [CommonModule, TranslateModule, BusinessReportsNavComponent, ...MATERIAL_IMPORTS],
  templateUrl: './alerts-history.component.html',
  styleUrls: ['./alerts-history.component.css', '../../styles/reports-animations.css'],
})
export class AlertsHistoryComponent implements OnInit {
  readonly store = inject(AlertsHistoryStore);
  readonly icons = GOOGLE_ICONS;

  readonly tabs: AlertLogTab[] = ['all', 'alerts', 'manual'];
  readonly filterOptions: AlertsFilterKey[] = ['critical', 'last24h', 'unresolved'];

  private readonly feedback = inject(UiFeedbackService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.store.load();

    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'all' || tab === 'alerts' || tab === 'manual') {
      this.store.setTab(tab);
    }
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.store.closeFiltersMenu();
    this.store.closeEntryMenu();
  }

  locationIcon(iconKey: string): string {
    return GOOGLE_ICONS[iconKey as GoogleIconKey] ?? GOOGLE_ICONS.deviceHub;
  }

  priorityClass(priority: AlertPriority): string {
    return `priority-badge priority-badge--${priority}`;
  }

  priorityKey(priority: AlertPriority): string {
    const map: Record<AlertPriority, string> = {
      critical: 'alertsHistory.priority.critical',
      medium: 'alertsHistory.priority.medium',
      low: 'alertsHistory.priority.low',
    };
    return map[priority];
  }

  statusClass(status: AlertEventStatus): string {
    return `status-badge status-badge--${status}`;
  }

  statusKey(status: AlertEventStatus): string {
    const map: Record<AlertEventStatus, string> = {
      unresolved: 'alertsHistory.status.unresolved',
      acknowledged: 'alertsHistory.status.acknowledged',
      systemNormal: 'alertsHistory.status.systemNormal',
      investigating: 'alertsHistory.status.investigating',
    };
    return map[status];
  }

  tabKey(tab: AlertLogTab): string {
    const map: Record<AlertLogTab, string> = {
      all: 'alertsHistory.tabs.all',
      alerts: 'alertsHistory.tabs.alerts',
      manual: 'alertsHistory.tabs.manual',
    };
    return map[tab];
  }

  formatPadded(value: number): string {
    return String(value).padStart(2, '0');
  }

  onTabChange(tab: AlertLogTab): void {
    this.store.setTab(tab);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
    });
  }

  onExportCsv(): void {
    const entries = this.store.filteredEntries();
    const rows: string[][] = [
      [
        this.translate.instant('alertsHistory.table.priority'),
        this.translate.instant('alertsHistory.table.eventDetail'),
        this.translate.instant('alertsHistory.table.location'),
        this.translate.instant('alertsHistory.table.timestamp'),
        this.translate.instant('alertsHistory.table.status'),
      ],
      ...entries.map(entry => [
        entry.priority,
        this.translate.instant(entry.titleKey),
        this.translate.instant(entry.locationKey),
        entry.timestamp,
        entry.status,
      ]),
    ];

    downloadCsvFile('domoticore-alerts-history.csv', rows);
    this.feedback.showToast(this.translate.instant('alertsHistory.toast.exportCsv'), 'success');
  }

  onToggleFilters(event: Event): void {
    event.stopPropagation();
    this.store.toggleFiltersMenu();
  }

  onApplyFilter(filter: AlertsFilterKey, event: Event): void {
    event.stopPropagation();
    this.store.setFilter(filter);
    this.feedback.showToast(
      this.translate.instant('alertsHistory.toast.filterApplied', {
        filter: this.translate.instant(`alertsHistory.filterOptions.${filter}`),
      }),
      'info',
    );
  }

  onClearFilter(event: Event): void {
    event.stopPropagation();
    this.store.setFilter('all');
  }

  onToggleEntryMenu(entry: AlertLogEntryResponse, event: Event): void {
    event.stopPropagation();
    this.store.toggleEntryMenu(entry.id);
  }

  onAcknowledgeEntry(entry: AlertLogEntryResponse): void {
    this.store.updateEntryStatus(entry.id, 'acknowledged');
    this.feedback.showToast(this.translate.instant('alertsHistory.toast.entryAcknowledged'), 'success');
  }

  onInvestigateEntry(entry: AlertLogEntryResponse): void {
    this.store.updateEntryStatus(entry.id, 'investigating');
    this.feedback.showToast(this.translate.instant('alertsHistory.toast.entryInvestigating'), 'info');
  }

  onResolveEntry(entry: AlertLogEntryResponse): void {
    this.store.updateEntryStatus(entry.id, 'systemNormal');
    this.feedback.showToast(this.translate.instant('alertsHistory.toast.entryResolved'), 'success');
  }

  onViewEntryLocation(entry: AlertLogEntryResponse): void {
    this.store.closeEntryMenu();
    this.router.navigate(['/app/devices']);
    this.feedback.showToast(
      this.translate.instant('alertsHistory.toast.viewingLocation', {
        location: this.translate.instant(entry.locationKey),
      }),
      'info',
    );
  }
}
