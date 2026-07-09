import { Injectable, computed, inject, signal } from '@angular/core';
import { CostAnalysisApiService } from '../infrastructure/cost-analysis-api.service';
import { CostAnalysisResponse } from '../infrastructure/cost-analysis-response';

export type AuditFilterKey = 'last6Months' | 'last12Months' | 'yearToDate';

@Injectable({ providedIn: 'root' })
export class CostAnalysisStore {
  private readonly api = inject(CostAnalysisApiService);

  readonly data = signal<CostAnalysisResponse | null>(null);
  readonly loading = signal(false);
  readonly auditFilter = signal<AuditFilterKey>('last6Months');
  readonly showAuditFilterMenu = signal(false);
  readonly roiRecalculating = signal(false);
  readonly contentAnimKey = signal(0);

  readonly filteredBillingAudit = computed(() => {
    const payload = this.data();
    if (!payload) return [];

    const filter = this.auditFilter();
    if (filter === 'last12Months') return payload.billingAudit;
    if (filter === 'yearToDate') return payload.billingAudit.slice(0, 1);
    return payload.billingAudit.slice(0, 2);
  });

  load(): void {
    this.loading.set(true);
    this.api.getCostAnalysis().subscribe({
      next: payload => {
        this.data.set(payload);
        this.contentAnimKey.update(key => key + 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleAuditFilterMenu(): void {
    this.showAuditFilterMenu.update(open => !open);
  }

  closeAuditFilterMenu(): void {
    this.showAuditFilterMenu.set(false);
  }

  setAuditFilter(filter: AuditFilterKey): void {
    this.auditFilter.set(filter);
    this.closeAuditFilterMenu();
    this.contentAnimKey.update(key => key + 1);
  }

  recalculateRoi(): void {
    const payload = this.data();
    if (!payload || this.roiRecalculating()) return;

    this.roiRecalculating.set(true);

    window.setTimeout(() => {
      this.data.set({
        ...payload,
        roiUpgrades: payload.roiUpgrades.map(upgrade => ({
          ...upgrade,
          paybackMonths: Math.max(8, upgrade.paybackMonths - 2),
          estimatedSavingsYear1: Math.round(upgrade.estimatedSavingsYear1 * 1.08),
          status: upgrade.status === 'review' ? 'approved' : upgrade.status,
        })),
        peakRiskProgress: Math.max(42, payload.peakRiskProgress - 8),
      });
      this.roiRecalculating.set(false);
      this.contentAnimKey.update(key => key + 1);
    }, 900);
  }
}
