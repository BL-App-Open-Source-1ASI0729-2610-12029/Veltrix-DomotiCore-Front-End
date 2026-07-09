import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ZoneConfigurationStore } from '../../../application/zone-configuration.store';
import {
  OvertimeType,
  ZoneConfigDetailResponse,
  ZoneIcon,
} from '../../../infrastructure/zone-configuration-response';
import { BusinessAutomationNavComponent } from '../../components/business-automation-nav/business-automation-nav.component';
import { GOOGLE_ICONS } from '../../../../shared/constants/google-icons';
import { APP_CURRENT_YEAR } from '../../../../shared/constants/app.constants';
import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

type FooterModalType = 'privacy' | 'health' | null;

@Component({
  selector: 'app-zone-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, BusinessAutomationNavComponent, ...MATERIAL_IMPORTS],
  templateUrl: './zone-configuration.component.html',
  styleUrls: ['./zone-configuration.component.css'],
})
export class ZoneConfigurationComponent implements OnInit {
  readonly store = inject(ZoneConfigurationStore);
  readonly icons = GOOGLE_ICONS;
  readonly currentYear = APP_CURRENT_YEAR;

  private readonly feedback = inject(UiFeedbackService);
  private readonly translate = inject(TranslateService);
  readonly router = inject(Router);

  readonly showBoundsModal = signal(false);
  readonly showScheduleModal = signal(false);
  readonly openOptionsZoneId = signal<string | null>(null);
  readonly footerModal = signal<FooterModalType>(null);
  readonly editingZoneId = signal<string | null>(null);

  ngOnInit(): void {
    this.store.load();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.openOptionsZoneId.set(null);
  }

  zoneIcon(icon: ZoneIcon): string {
    const map: Record<ZoneIcon, string> = {
      building: GOOGLE_ICONS.briefcase,
      loading: GOOGLE_ICONS.localShipping,
      kitchen: GOOGLE_ICONS.refrigerator,
    };
    return map[icon];
  }

  formatCurrency(value: number): string {
    return `$${value.toLocaleString('en-US')}`;
  }

  editingZone(): ZoneConfigDetailResponse | null {
    const zoneId = this.editingZoneId();
    return zoneId ? this.store.getZone(zoneId) : null;
  }

  editingDraft() {
    const zoneId = this.editingZoneId();
    return zoneId ? this.store.getDraft(zoneId) : null;
  }

  onBudgetInput(zoneId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.store.updateDraft(zoneId, { energyBudget: Number(input.value) });
  }

  onToggleAlerts(zoneId: string, enabled: boolean): void {
    this.store.updateDraft(zoneId, { criticalTempAlertsEnabled: enabled });
  }

  onUpperLimit(zoneId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.store.updateDraft(zoneId, { upperTempLimit: Number(input.value) });
  }

  onLowerLimit(zoneId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.store.updateDraft(zoneId, { lowerTempLimit: Number(input.value) });
  }

  onModalBudgetInput(event: Event): void {
    const zoneId = this.editingZoneId();
    if (!zoneId) return;
    this.onBudgetInput(zoneId, event);
  }

  onModalToggleAlerts(enabled: boolean): void {
    const zoneId = this.editingZoneId();
    if (!zoneId) return;
    this.onToggleAlerts(zoneId, enabled);
  }

  onModalUpperLimit(event: Event): void {
    const zoneId = this.editingZoneId();
    if (!zoneId) return;
    this.onUpperLimit(zoneId, event);
  }

  onModalLowerLimit(event: Event): void {
    const zoneId = this.editingZoneId();
    if (!zoneId) return;
    this.onLowerLimit(zoneId, event);
  }

  onScheduleMorningChange(value: string): void {
    const zoneId = this.editingZoneId();
    if (!zoneId) return;
    this.store.updateDraft(zoneId, { morningOn: value });
  }

  onScheduleEveningChange(value: string): void {
    const zoneId = this.editingZoneId();
    if (!zoneId) return;
    this.store.updateDraft(zoneId, { eveningOff: value });
  }

  onScheduleOvertimeChange(value: OvertimeType): void {
    const zoneId = this.editingZoneId();
    if (!zoneId) return;
    this.store.updateDraft(zoneId, { overtimeType: value });
  }

  draftFor(zone: ZoneConfigDetailResponse) {
    return this.store.getDraft(zone.id);
  }

  onSaveAll(): void {
    this.store.saveAll();
    this.feedback.showToast(this.translate.instant('zoneConfiguration.toast.saved'), 'success');
  }

  onDiscard(): void {
    this.store.discardChanges();
    this.feedback.showToast(this.translate.instant('zoneConfiguration.toast.discarded'), 'info');
  }

  onEditBounds(zone: ZoneConfigDetailResponse): void {
    this.editingZoneId.set(zone.id);
    this.showBoundsModal.set(true);
  }

  onOpenSchedule(zone: ZoneConfigDetailResponse): void {
    this.editingZoneId.set(zone.id);
    this.showScheduleModal.set(true);
  }

  closeBoundsModal(): void {
    this.showBoundsModal.set(false);
    this.editingZoneId.set(null);
  }

  closeScheduleModal(): void {
    this.showScheduleModal.set(false);
    this.editingZoneId.set(null);
  }

  onConfirmBounds(): void {
    const zone = this.editingZone();
    if (!zone) return;

    this.closeBoundsModal();
    this.feedback.showToast(
      this.translate.instant('zoneConfiguration.toast.boundsUpdated', {
        zone: this.translate.instant(zone.nameKey),
      }),
      'success',
    );
  }

  onConfirmSchedule(): void {
    const zone = this.editingZone();
    if (!zone) return;

    this.closeScheduleModal();
    this.feedback.showToast(
      this.translate.instant('zoneConfiguration.toast.scheduleUpdated', {
        zone: this.translate.instant(zone.nameKey),
      }),
      'success',
    );
  }

  onToggleOptionsMenu(zone: ZoneConfigDetailResponse, event: Event): void {
    event.stopPropagation();
    this.openOptionsZoneId.update(current => (current === zone.id ? null : zone.id));
  }

  onSetPrimaryZone(zone: ZoneConfigDetailResponse): void {
    this.store.setPrimaryZone(zone.id);
    this.openOptionsZoneId.set(null);
    this.feedback.showToast(
      this.translate.instant('zoneConfiguration.toast.primarySet', {
        zone: this.translate.instant(zone.nameKey),
      }),
      'success',
    );
  }

  onToggleMonitoring(zone: ZoneConfigDetailResponse): void {
    this.store.toggleMonitoring(zone.id);
    this.openOptionsZoneId.set(null);
    const enabled = this.store.getZone(zone.id)?.activeMonitoring;
    this.feedback.showToast(
      this.translate.instant(
        enabled ? 'zoneConfiguration.toast.monitoringEnabled' : 'zoneConfiguration.toast.monitoringDisabled',
        { zone: this.translate.instant(zone.nameKey) },
      ),
      'info',
    );
  }

  onResetZone(zone: ZoneConfigDetailResponse): void {
    this.store.resetZoneDefaults(zone.id);
    this.openOptionsZoneId.set(null);
    this.feedback.showToast(
      this.translate.instant('zoneConfiguration.toast.zoneReset', {
        zone: this.translate.instant(zone.nameKey),
      }),
      'info',
    );
  }

  onInsightClick(insightId: string): void {
    const zoneMap: Record<string, string> = {
      'insight-1': 'kitchen',
      'insight-2': 'loading-dock',
    };
    const zoneId = zoneMap[insightId];
    const zone = zoneId ? this.store.getZone(zoneId) : null;
    if (!zone) return;

    this.onEditBounds(zone);
  }

  onViewFullLog(): void {
    this.router.navigate(['/app/reports/alerts-history']);
    this.feedback.showToast(this.translate.instant('zoneConfiguration.toast.openingAudit'), 'info');
  }

  onFooterLink(link: 'privacy' | 'health'): void {
    this.footerModal.set(link);
  }

  closeFooterModal(): void {
    this.footerModal.set(null);
  }

  overtimeOptions(): OvertimeType[] {
    return ['manual', 'motion', 'photo'];
  }

  overtimeLabel(type: OvertimeType): string {
    return this.translate.instant(`zoneConfiguration.schedule.overtime.${type}`);
  }
}
