import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  EnergyAlertMetric,
  EnergyAlertPeriod,
  EnergyAlertRule,
  EnergyAlertRulesService,
  EnergyAlertSeverity,
} from '../../../services/energy-alert-rules.service';
import { UiFeedbackService } from '../../../services/ui-feedback.service';
import { MATERIAL_IMPORTS } from '../../../material';

@Component({
  selector: 'app-energy-alert-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ...MATERIAL_IMPORTS],
  template: `
    <div class="alert-builder">
      <div class="alert-builder__list" *ngIf="showList">
        <article class="alert-rule" *ngFor="let rule of rules.rules()">
          <div>
            <strong>{{ rule.name }}</strong>
            <p>
              {{ ('energyAlerts.metrics.' + rule.metric) | translate }} ·
              {{ rule.thresholdKwh }} kWh ·
              {{ ('energyAlerts.periods.' + rule.period) | translate }}
            </p>
          </div>
          <div class="alert-rule__actions">
            <mat-slide-toggle [checked]="rule.enabled" (change)="rules.toggle(rule.id)"></mat-slide-toggle>
            <button type="button" mat-icon-button (click)="removeRule(rule.id)" [attr.aria-label]="'common.a11y.close' | translate">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </article>
        <p class="alert-builder__empty" *ngIf="!rules.rules().length">
          {{ 'energyAlerts.empty' | translate }}
        </p>
      </div>

      <form class="alert-builder__form" (ngSubmit)="submit()">
        <h4 *ngIf="showList">{{ 'energyAlerts.addRule' | translate }}</h4>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'energyAlerts.ruleName' | translate }}</mat-label>
          <input matInput [(ngModel)]="name" name="ruleName" required />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'energyAlerts.metric' | translate }}</mat-label>
          <mat-select [(ngModel)]="metric" name="metric">
            <mat-option value="totalConsumption">{{ 'energyAlerts.metrics.totalConsumption' | translate }}</mat-option>
            <mat-option value="peakDemand">{{ 'energyAlerts.metrics.peakDemand' | translate }}</mat-option>
            <mat-option value="deviceConsumption">{{ 'energyAlerts.metrics.deviceConsumption' | translate }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'energyAlerts.threshold' | translate }}</mat-label>
          <input matInput type="number" min="0.1" step="0.1" [(ngModel)]="thresholdKwh" name="threshold" required />
        </mat-form-field>

        <div class="alert-builder__row">
          <mat-form-field appearance="outline">
            <mat-label>{{ 'energyAlerts.period' | translate }}</mat-label>
            <mat-select [(ngModel)]="period" name="period">
              <mat-option value="day">{{ 'energyAlerts.periods.day' | translate }}</mat-option>
              <mat-option value="week">{{ 'energyAlerts.periods.week' | translate }}</mat-option>
              <mat-option value="month">{{ 'energyAlerts.periods.month' | translate }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ 'common.severity' | translate }}</mat-label>
            <mat-select [(ngModel)]="severity" name="severity">
              <mat-option value="warning">{{ 'common.severityLevels.warning' | translate }}</mat-option>
              <mat-option value="critical">{{ 'common.severityLevels.critical' | translate }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="alert-builder__actions">
          <button type="button" mat-button *ngIf="showCancel" (click)="cancelled.emit()">
            {{ 'common.cancel' | translate }}
          </button>
          <button type="submit" mat-flat-button color="primary" [disabled]="!canSubmit()">
            {{ 'energyAlerts.saveRule' | translate }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .full-width { width: 100%; }
    .alert-builder { display: grid; gap: 1rem; }
    .alert-builder__list { display: grid; gap: 0.65rem; max-height: 220px; overflow-y: auto; }
    .alert-rule {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      align-items: center;
      padding: 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: #f8fafc;
    }
    .alert-rule strong { display: block; color: #111827; }
    .alert-rule p { margin: 0.2rem 0 0; color: #4b5563; font-size: 0.85rem; }
    .alert-rule__actions { display: flex; align-items: center; gap: 0.25rem; }
    .alert-builder__empty { color: #6b7280; font-size: 0.9rem; margin: 0; }
    .alert-builder__form { display: grid; gap: 0.5rem; }
    .alert-builder__row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .alert-builder__actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.25rem; }
    @media (max-width: 640px) {
      .alert-builder__row { grid-template-columns: 1fr; }
    }
  `],
})
export class EnergyAlertBuilderComponent {
  readonly rules = inject(EnergyAlertRulesService);
  private readonly feedback = inject(UiFeedbackService);
  private readonly translate = inject(TranslateService);

  @Input() showList = true;
  @Input() showCancel = true;
  @Output() saved = new EventEmitter<EnergyAlertRule>();
  @Output() cancelled = new EventEmitter<void>();

  name = '';
  metric: EnergyAlertMetric = 'totalConsumption';
  thresholdKwh = 10;
  period: EnergyAlertPeriod = 'day';
  severity: EnergyAlertSeverity = 'warning';

  canSubmit(): boolean {
    return !!this.name.trim() && this.thresholdKwh > 0;
  }

  submit(): void {
    if (!this.canSubmit()) return;

    const rule = this.rules.add({
      name: this.name.trim(),
      metric: this.metric,
      thresholdKwh: this.thresholdKwh,
      period: this.period,
      severity: this.severity,
      enabled: true,
    });

    this.name = '';
    this.thresholdKwh = 10;
    this.feedback.showToast(this.translate.instant('energyAlerts.toast.saved'), 'success');
    this.saved.emit(rule);
  }

  removeRule(id: string): void {
    this.rules.remove(id);
    this.feedback.showToast(this.translate.instant('energyAlerts.toast.removed'), 'info');
  }
}
