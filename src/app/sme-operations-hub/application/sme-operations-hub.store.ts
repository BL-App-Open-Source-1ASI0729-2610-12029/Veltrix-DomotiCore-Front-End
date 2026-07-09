import { Injectable, inject, signal } from '@angular/core';
import { GOOGLE_ICONS } from '../../shared/constants/google-icons';
import { SmeOperationsHubApiService, OperationsHubSnapshotResponse } from '../infrastructure/sme-operations-hub-api.service';

export type SmeDateRange = 'thisMonth' | 'lastMonth' | 'thisQuarter';

export interface SmeKpiCard {
  titleKey: string;
  value?: string;
  unit?: string;
  trend?: { value: string; positive: boolean };
  footerKey?: string;
  footerValue?: string;
  icon: string;
  variant?: 'consumption' | 'cost' | 'budget';
  progress?: number;
  projectedKey?: string;
  projectedValue?: string;
  breakdown?: { labelKey: string; value: string }[];
  budgetCurrent?: string;
  budgetTotal?: string;
  budgetPercent?: number;
}

export interface LoadBar {
  time: string;
  hvac: number;
  lighting: number;
  servers: number;
  highlighted?: boolean;
}

export interface SmeAlert {
  id: string;
  titleKey: string;
  descriptionKey: string;
  timeKey: string;
  critical: boolean;
}

export interface SmeDeviceStatus {
  id: string;
  nameKey: string;
  statusKey: string;
  power: string;
  icon: string;
  variant: 'online' | 'active' | 'idle' | 'optimal';
  route: string[];
  queryParams?: Record<string, string>;
}

export interface FacilityZone {
  id: string;
  nameKey: string;
  power: string;
  x: number;
  y: number;
  variant: 'normal' | 'alert';
  route: string[];
  queryParams?: Record<string, string>;
}

interface HubSnapshot {
  kpis: SmeKpiCard[];
  loadBars: LoadBar[];
  sustainabilityScore: number;
  criticalAlertCount: number;
  highlightedLoadKw: string;
}

const BASE_KPIS: SmeKpiCard[] = [
  {
    titleKey: 'smeHub.kpis.consumption.title',
    value: '14,280',
    unit: 'kWh',
    trend: { value: '+12.4%', positive: false },
    footerKey: 'smeHub.kpis.consumption.footer',
    icon: GOOGLE_ICONS.power,
    variant: 'consumption',
    progress: 75,
  },
  {
    titleKey: 'smeHub.kpis.cost.title',
    value: '$2,184.50',
    projectedKey: 'smeHub.kpis.cost.projected',
    projectedValue: '$3,450',
    breakdown: [
      { labelKey: 'smeHub.kpis.cost.offPeak', value: '$840.00' },
      { labelKey: 'smeHub.kpis.cost.peak', value: '$1,344.50' },
    ],
    icon: GOOGLE_ICONS.receipt,
    variant: 'cost',
  },
  {
    titleKey: 'smeHub.kpis.budget.title',
    budgetPercent: 70,
    budgetCurrent: '$2,800.00',
    budgetTotal: '$4,000.00',
    icon: GOOGLE_ICONS.savings,
    variant: 'budget',
  },
];

const BASE_LOAD_BARS: LoadBar[] = [
  { time: '08:00', hvac: 12, lighting: 6, servers: 8 },
  { time: '09:00', hvac: 14, lighting: 7, servers: 10 },
  { time: '10:00', hvac: 16, lighting: 8, servers: 12 },
  { time: '11:00', hvac: 18, lighting: 9, servers: 14 },
  { time: '12:00', hvac: 20, lighting: 10, servers: 16 },
  { time: '13:00', hvac: 22, lighting: 11, servers: 18, highlighted: true },
  { time: '14:00', hvac: 19, lighting: 9, servers: 15 },
  { time: 'NOW', hvac: 17, lighting: 8, servers: 13 },
];

const HUB_SNAPSHOTS: Record<SmeDateRange, HubSnapshot> = {
  thisMonth: {
    kpis: BASE_KPIS,
    loadBars: BASE_LOAD_BARS,
    sustainabilityScore: 84,
    criticalAlertCount: 2,
    highlightedLoadKw: '24.2kW',
  },
  lastMonth: {
    kpis: [
      { ...BASE_KPIS[0], value: '12,940', trend: { value: '-4.2%', positive: true }, progress: 68 },
      { ...BASE_KPIS[1], value: '$1,982.20', projectedValue: '$3,120' },
      { ...BASE_KPIS[2], budgetPercent: 62, budgetCurrent: '$2,480.00' },
    ],
    loadBars: BASE_LOAD_BARS.map(bar => ({
      ...bar,
      hvac: Math.round(bar.hvac * 0.92),
      lighting: Math.round(bar.lighting * 0.9),
      servers: Math.round(bar.servers * 0.88),
    })),
    sustainabilityScore: 81,
    criticalAlertCount: 1,
    highlightedLoadKw: '21.8kW',
  },
  thisQuarter: {
    kpis: [
      { ...BASE_KPIS[0], value: '41,560', unit: 'kWh', trend: { value: '+8.1%', positive: false }, progress: 82 },
      { ...BASE_KPIS[1], value: '$6,540.00', projectedValue: '$9,800' },
      { ...BASE_KPIS[2], budgetPercent: 78, budgetCurrent: '$3,120.00', budgetTotal: '$4,000.00' },
    ],
    loadBars: BASE_LOAD_BARS.map(bar => ({
      ...bar,
      hvac: Math.round(bar.hvac * 1.08),
      lighting: Math.round(bar.lighting * 1.05),
      servers: Math.round(bar.servers * 1.1),
    })),
    sustainabilityScore: 86,
    criticalAlertCount: 3,
    highlightedLoadKw: '26.4kW',
  },
};

const BASE_ALERTS: SmeAlert[] = [
  {
    id: 'server-rack',
    titleKey: 'smeHub.alerts.serverRack.title',
    descriptionKey: 'smeHub.alerts.serverRack.description',
    timeKey: 'smeHub.alerts.serverRack.time',
    critical: true,
  },
  {
    id: 'hvac-overload',
    titleKey: 'smeHub.alerts.hvacOverload.title',
    descriptionKey: 'smeHub.alerts.hvacOverload.description',
    timeKey: 'smeHub.alerts.hvacOverload.time',
    critical: true,
  },
  {
    id: 'lighting-schedule',
    titleKey: 'smeHub.alerts.lightingSchedule.title',
    descriptionKey: 'smeHub.alerts.lightingSchedule.description',
    timeKey: 'smeHub.alerts.lightingSchedule.time',
    critical: false,
  },
];

@Injectable({ providedIn: 'root' })
export class SmeOperationsHubStore {
  private readonly hubApi = inject(SmeOperationsHubApiService);

  readonly selectedRange = signal<SmeDateRange>('thisMonth');
  readonly dataRefreshing = signal(false);

  readonly kpis = signal<SmeKpiCard[]>(cloneKpis(HUB_SNAPSHOTS.thisMonth.kpis));
  readonly loadBars = signal<LoadBar[]>(cloneLoadBars(HUB_SNAPSHOTS.thisMonth.loadBars));
  readonly alerts = signal<SmeAlert[]>(BASE_ALERTS.map(alert => ({ ...alert })));

  readonly deviceStatuses = signal<SmeDeviceStatus[]>([
    {
      id: 'hvac',
      nameKey: 'smeHub.devices.hvac.name',
      statusKey: 'smeHub.devices.hvac.status',
      power: '2.4kW',
      icon: GOOGLE_ICONS.acUnit,
      variant: 'online',
      route: ['/app/automation/zones'],
    },
    {
      id: 'lighting',
      nameKey: 'smeHub.devices.lighting.name',
      statusKey: 'smeHub.devices.lighting.status',
      power: '0.8kW',
      icon: GOOGLE_ICONS.lightbulb,
      variant: 'active',
      route: ['/app/devices/management'],
      queryParams: { zone: 'retail' },
    },
    {
      id: 'production',
      nameKey: 'smeHub.devices.production.name',
      statusKey: 'smeHub.devices.production.status',
      power: '0.1kW',
      icon: GOOGLE_ICONS.factory,
      variant: 'idle',
      route: ['/app/devices/explorer'],
      queryParams: { zone: 'loading-dock' },
    },
    {
      id: 'servers',
      nameKey: 'smeHub.devices.servers.name',
      statusKey: 'smeHub.devices.servers.status',
      power: '5.2kW',
      icon: GOOGLE_ICONS.dns,
      variant: 'optimal',
      route: ['/app/reports/alerts-history'],
      queryParams: { tab: 'alerts' },
    },
  ]);

  readonly facilityZones = signal<FacilityZone[]>([
    {
      id: 'north-wing',
      nameKey: 'smeHub.facility.northWing',
      power: '8.2 kW',
      x: 42,
      y: 32,
      variant: 'normal',
      route: ['/app/devices/management'],
      queryParams: { zone: 'office' },
    },
    {
      id: 'warehouse',
      nameKey: 'smeHub.facility.warehouse',
      power: '12.5 kW',
      x: 72,
      y: 58,
      variant: 'alert',
      route: ['/app/devices/explorer'],
      queryParams: { zone: 'loading-dock' },
    },
  ]);

  readonly sustainabilityScore = signal(HUB_SNAPSHOTS.thisMonth.sustainabilityScore);
  readonly criticalAlertCount = signal(HUB_SNAPSHOTS.thisMonth.criticalAlertCount);
  readonly highlightedLoadKw = signal(HUB_SNAPSHOTS.thisMonth.highlightedLoadKw);

  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.loadFromApi('thisMonth');
  }

  /** Returns true when the visible range changed. */
  setDateRange(range: SmeDateRange): boolean {
    if (this.selectedRange() === range) {
      return false;
    }

    this.selectedRange.set(range);

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    this.dataRefreshing.set(true);
    this.loadFromApi(range);
    return true;
  }

  private loadFromApi(range: SmeDateRange): void {
    this.hubApi.getSnapshot(range).subscribe((snapshot: OperationsHubSnapshotResponse | null) => {
      if (this.selectedRange() !== range) {
        this.dataRefreshing.set(false);
        return;
      }

      if (snapshot) {
        this.kpis.set(cloneKpis(snapshot.kpis as SmeKpiCard[]));
        this.loadBars.set(cloneLoadBars(snapshot.loadBars as LoadBar[]));
        if (snapshot.alerts?.length) {
          this.alerts.set(snapshot.alerts as SmeAlert[]);
        }
        if (snapshot.deviceStatuses?.length) {
          this.deviceStatuses.set(snapshot.deviceStatuses as SmeDeviceStatus[]);
        }
        if (snapshot.facilityZones?.length) {
          this.facilityZones.set(snapshot.facilityZones as FacilityZone[]);
        }
        this.sustainabilityScore.set(snapshot.sustainabilityScore);
        this.criticalAlertCount.set(snapshot.criticalAlertCount);
        this.highlightedLoadKw.set(snapshot.highlightedLoadKw);
        this.dataRefreshing.set(false);
        return;
      }

      this.refreshTimer = setTimeout(() => {
        if (this.selectedRange() !== range) {
          this.dataRefreshing.set(false);
          this.refreshTimer = null;
          return;
        }

        const local = HUB_SNAPSHOTS[range];
        this.kpis.set(cloneKpis(local.kpis));
        this.loadBars.set(cloneLoadBars(local.loadBars));
        this.sustainabilityScore.set(local.sustainabilityScore);
        this.criticalAlertCount.set(local.criticalAlertCount);
        this.highlightedLoadKw.set(local.highlightedLoadKw);
        this.dataRefreshing.set(false);
        this.refreshTimer = null;
      }, 320);
    });
  }

  buildAuditExport(): Record<string, unknown> {
    return {
      exportedAt: new Date().toISOString(),
      facility: 'North Wing Facility',
      range: this.selectedRange(),
      kpis: this.kpis(),
      loadDistribution: this.loadBars(),
      alerts: this.alerts(),
      deviceStatuses: this.deviceStatuses(),
      facilityZones: this.facilityZones(),
      sustainabilityScore: this.sustainabilityScore(),
    };
  }
}

function cloneKpis(kpis: SmeKpiCard[]): SmeKpiCard[] {
  return kpis.map(kpi => ({
    ...kpi,
    trend: kpi.trend ? { ...kpi.trend } : undefined,
    breakdown: kpi.breakdown?.map(item => ({ ...item })),
  }));
}

function cloneLoadBars(bars: LoadBar[]): LoadBar[] {
  return bars.map(bar => ({ ...bar }));
}
