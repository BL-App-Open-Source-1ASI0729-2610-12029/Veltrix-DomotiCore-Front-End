import { Injectable, computed, inject, signal } from '@angular/core';
import { ZoneConfigurationApiService } from '../infrastructure/zone-configuration-api.service';
import {
  ConfigAuditEntryResponse,
  OvertimeType,
  ZoneConfigDetailResponse,
  ZoneConfigurationResponse,
} from '../infrastructure/zone-configuration-response';

export interface ZoneDraft {
  energyBudget: number;
  criticalTempAlertsEnabled: boolean;
  upperTempLimit: number;
  lowerTempLimit: number;
  morningOn: string;
  eveningOff: string;
  overtimeType: OvertimeType;
}

const ZONE_DEFAULTS: Record<string, Partial<ZoneDraft>> = {
  'loading-dock': {
    energyBudget: 1200,
    upperTempLimit: 32,
    lowerTempLimit: 10,
    morningOn: '08:00 AM',
    eveningOff: '06:00 PM',
    overtimeType: 'motion',
  },
  kitchen: {
    energyBudget: 3800,
    upperTempLimit: 8,
    lowerTempLimit: 2,
    morningOn: '06:00 AM',
    eveningOff: '10:00 PM',
    overtimeType: 'photo',
  },
  'main-office': {
    energyBudget: 2450,
    upperTempLimit: 26,
    lowerTempLimit: 18,
    morningOn: '07:30 AM',
    eveningOff: '08:00 PM',
    overtimeType: 'manual',
  },
};

@Injectable({ providedIn: 'root' })
export class ZoneConfigurationStore {
  private readonly api = inject(ZoneConfigurationApiService);

  readonly data = signal<ZoneConfigurationResponse | null>(null);
  readonly loading = signal(false);
  readonly drafts = signal<Record<string, ZoneDraft>>({});
  readonly dirty = signal(false);

  readonly primaryZone = computed(() => {
    const payload = this.data();
    if (!payload) return null;
    return payload.zones.find(zone => zone.id === payload.primaryZoneId) ?? null;
  });

  readonly secondaryZones = computed(() => {
    const payload = this.data();
    if (!payload) return [];
    return payload.zones.filter(zone => !zone.isPrimary);
  });

  load(): void {
    this.loading.set(true);
    this.api.getZoneConfiguration().subscribe({
      next: payload => {
        this.data.set(payload);
        this.resetDrafts(payload);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getZone(zoneId: string): ZoneConfigDetailResponse | null {
    return this.data()?.zones.find(zone => zone.id === zoneId) ?? null;
  }

  getDraft(zoneId: string): ZoneDraft | null {
    return this.drafts()[zoneId] ?? null;
  }

  updateDraft(zoneId: string, patch: Partial<ZoneDraft>): void {
    const current = this.drafts()[zoneId];
    if (!current) return;

    this.drafts.update(all => ({
      ...all,
      [zoneId]: { ...current, ...patch },
    }));
    this.dirty.set(true);
  }

  toggleMonitoring(zoneId: string): void {
    const payload = this.data();
    if (!payload) return;

    const zones = payload.zones.map(zone =>
      zone.id === zoneId ? { ...zone, activeMonitoring: !zone.activeMonitoring } : zone,
    );

    this.data.set({ ...payload, zones });
    this.dirty.set(true);
  }

  setPrimaryZone(zoneId: string): void {
    const payload = this.data();
    if (!payload || payload.primaryZoneId === zoneId) return;

    const zones = payload.zones.map(zone => ({
      ...zone,
      isPrimary: zone.id === zoneId,
    }));

    this.data.set({
      ...payload,
      primaryZoneId: zoneId,
      zones,
    });
    this.dirty.set(true);
  }

  resetZoneDefaults(zoneId: string): void {
    const zone = this.getZone(zoneId);
    const defaults = ZONE_DEFAULTS[zoneId];
    if (!zone || !defaults) return;

    this.updateDraft(zoneId, {
      energyBudget: defaults.energyBudget ?? zone.energyBudget,
      criticalTempAlertsEnabled: true,
      upperTempLimit: defaults.upperTempLimit ?? zone.upperTempLimit,
      lowerTempLimit: defaults.lowerTempLimit ?? zone.lowerTempLimit,
      morningOn: defaults.morningOn ?? zone.schedule.morningOn,
      eveningOff: defaults.eveningOff ?? zone.schedule.eveningOff,
      overtimeType: defaults.overtimeType ?? zone.schedule.overtimeType,
    });
  }

  saveAll(): void {
    const payload = this.data();
    if (!payload) return;

    const drafts = this.drafts();
    const zones = payload.zones.map(zone => {
      const draft = drafts[zone.id];
      if (!draft) return zone;

      return {
        ...zone,
        energyBudget: draft.energyBudget,
        criticalTempAlertsEnabled: draft.criticalTempAlertsEnabled,
        upperTempLimit: draft.upperTempLimit,
        lowerTempLimit: draft.lowerTempLimit,
        schedule: {
          ...zone.schedule,
          morningOn: draft.morningOn,
          eveningOff: draft.eveningOff,
          overtimeType: draft.overtimeType,
          overtimeRule: this.overtimeLabel(draft.overtimeType),
        },
      };
    });

    const auditEntry: ConfigAuditEntryResponse = {
      id: `audit-${Date.now()}`,
      timestamp: this.formatNow(),
      modifierName: 'You',
      modifierType: 'user',
      modifierInitials: 'YO',
      actionKey: 'zoneConfiguration.audit.actions.configSaved',
      zoneKey: 'zoneConfiguration.audit.allZones',
      status: 'applied',
    };

    const nextPayload = {
      ...payload,
      zones,
      auditLog: [auditEntry, ...payload.auditLog].slice(0, 10),
    };

    this.data.set(nextPayload);
    this.resetDrafts(nextPayload);
    this.dirty.set(false);
    this.api.saveZoneConfiguration(nextPayload).subscribe();
  }

  discardChanges(): void {
    const payload = this.data();
    if (!payload) return;
    this.resetDrafts(payload);
    this.dirty.set(false);
  }

  budgetPercent(zone: ZoneConfigDetailResponse, draft?: ZoneDraft | null): number {
    const value = draft?.energyBudget ?? zone.energyBudget;
    const span = zone.energyBudgetMax - zone.energyBudgetMin;
    if (!span) return 0;
    return ((value - zone.energyBudgetMin) / span) * 100;
  }

  overtimeLabel(type: OvertimeType): string {
    const labels: Record<OvertimeType, string> = {
      manual: 'Manual Override',
      motion: 'Motion Sensor',
      photo: 'Photosensor',
    };
    return labels[type];
  }

  private resetDrafts(payload: ZoneConfigurationResponse): void {
    const next: Record<string, ZoneDraft> = {};
    payload.zones.forEach(zone => {
      next[zone.id] = {
        energyBudget: zone.energyBudget,
        criticalTempAlertsEnabled: zone.criticalTempAlertsEnabled,
        upperTempLimit: zone.upperTempLimit,
        lowerTempLimit: zone.lowerTempLimit,
        morningOn: zone.schedule.morningOn,
        eveningOff: zone.schedule.eveningOff,
        overtimeType: zone.schedule.overtimeType,
      };
    });
    this.drafts.set(next);
  }

  private formatNow(): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date());
  }
}
