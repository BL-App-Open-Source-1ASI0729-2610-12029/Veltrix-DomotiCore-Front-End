import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type EnergyAlertMetric = 'totalConsumption' | 'peakDemand' | 'deviceConsumption';
export type EnergyAlertPeriod = 'day' | 'week' | 'month';
export type EnergyAlertSeverity = 'warning' | 'critical';

export interface EnergyAlertRule {
  id: string;
  name: string;
  metric: EnergyAlertMetric;
  thresholdKwh: number;
  period: EnergyAlertPeriod;
  severity: EnergyAlertSeverity;
  enabled: boolean;
  deviceId?: string;
  createdAt: string;
}

const STORAGE_KEY = 'domoticore.energy-alert-rules';

const DEFAULT_RULES: EnergyAlertRule[] = [
  {
    id: 'rule-peak-day',
    name: 'Daily peak threshold',
    metric: 'peakDemand',
    thresholdKwh: 8,
    period: 'day',
    severity: 'warning',
    enabled: true,
    createdAt: new Date().toISOString(),
  },
];

@Injectable({ providedIn: 'root' })
export class EnergyAlertRulesService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly rulesSignal = signal<EnergyAlertRule[]>(this.load());

  readonly rules = this.rulesSignal.asReadonly();

  add(rule: Omit<EnergyAlertRule, 'id' | 'createdAt'>): EnergyAlertRule {
    const created: EnergyAlertRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.persist([created, ...this.rulesSignal()]);
    return created;
  }

  update(id: string, patch: Partial<EnergyAlertRule>): void {
    this.persist(
      this.rulesSignal().map(rule => (rule.id === id ? { ...rule, ...patch, id: rule.id } : rule)),
    );
  }

  remove(id: string): void {
    this.persist(this.rulesSignal().filter(rule => rule.id !== id));
  }

  toggle(id: string): void {
    this.update(id, { enabled: !this.rulesSignal().find(rule => rule.id === id)?.enabled });
  }

  private persist(rules: EnergyAlertRule[]): void {
    this.rulesSignal.set(rules);
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  }

  private load(): EnergyAlertRule[] {
    if (!isPlatformBrowser(this.platformId)) return DEFAULT_RULES;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_RULES;
      const parsed = JSON.parse(raw) as EnergyAlertRule[];
      return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_RULES;
    } catch {
      return DEFAULT_RULES;
    }
  }
}
