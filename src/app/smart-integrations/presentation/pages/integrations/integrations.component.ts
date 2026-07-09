import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BoundedContextsOverviewComponent } from '../../../../shared/presentation/components/bounded-contexts-overview/bounded-contexts-overview.component';
import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

interface UploadedDocument {
  name: string;
  uploadedAt: string;
}

const INTEGRATIONS_STORAGE_KEY = 'domoticore-integrations-config';

@Component({
  selector: 'app-integrations',
  standalone: true,
  imports: [CommonModule, FormsModule, BoundedContextsOverviewComponent, TranslateModule, ...MATERIAL_IMPORTS],
  template: `
    <div class="dashboard-page integrations-page">
      <app-bounded-contexts-overview></app-bounded-contexts-overview>
      <div class="page-header integrations-animate integrations-animate--down">
        <div>
          <p class="page-eyebrow">{{ 'businessProfile.breadcrumb' | translate }}</p>
          <h1>{{ 'businessProfile.title' | translate }}</h1>
          <p class="page-description">
            {{ 'businessProfile.description' | translate }}
          </p>
        </div>
        <button mat-flat-button color="primary" class="btn btn-primary" (click)="saveConfiguration()">{{ 'buttons.saveConfiguration' | translate }}</button>
      </div>

      <div class="summary-grid">
        <section class="panel panel-large integrations-animate integrations-animate--up">
          <div class="panel-header">
            <div class="panel-header__icon">
              <mat-icon>business</mat-icon>
            </div>
            <div>
              <div class="panel-title">{{ 'businessProfile.corporateIdentity' | translate }}</div>
              <p class="panel-subtitle">{{ 'businessProfile.corporateIdentityDesc' | translate }}</p>
            </div>
          </div>
          <div class="identity-stats">
            <article class="identity-stat">
              <span>{{ 'integrations.identity.facilities' | translate }}</span>
              <strong>4</strong>
            </article>
            <article class="identity-stat">
              <span>{{ 'integrations.identity.devices' | translate }}</span>
              <strong>128</strong>
            </article>
            <article class="identity-stat">
              <span>{{ 'integrations.identity.energyTier' | translate }}</span>
              <strong>{{ 'integrations.identity.tierValue' | translate }}</strong>
            </article>
          </div>
          <div class="field-grid field-grid--two-col">
            <div class="field-row">
              <label>{{ 'businessProfile.legalBusinessName' | translate }}</label>
              <input type="text" [ngModel]="businessName()" (ngModelChange)="businessName.set($event)" name="businessName" />
            </div>
            <div class="field-row">
              <label>{{ 'businessProfile.tin' | translate }}</label>
              <input type="text" [ngModel]="tin()" (ngModelChange)="tin.set($event)" name="tin" />
            </div>
            <div class="field-row full-width">
              <label>{{ 'businessProfile.headquartersAddress' | translate }}</label>
              <input type="text" [ngModel]="address()" (ngModelChange)="address.set($event)" name="address" />
            </div>
          </div>
          <div class="compliance-chips">
            <span class="compliance-chip compliance-chip--verified">{{ 'integrations.identity.complianceEnergy' | translate }}</span>
            <span class="compliance-chip">{{ 'integrations.identity.complianceTax' | translate }}</span>
            <span class="compliance-chip">{{ 'integrations.identity.complianceAudit' | translate }}</span>
          </div>
        </section>

        <aside class="panel-column integrations-animate integrations-animate--left">
          <section class="panel panel-primary">
            <div class="panel-title">{{ 'apiAccess.title' | translate }}</div>
            <p class="panel-subtitle">{{ 'apiAccess.description' | translate }}</p>
            <div class="key-card">
              <div>
                <span class="key-label">{{ 'apiAccess.primaryMonitoringKey' | translate }}</span>
                <p class="key-value">{{ apiKey() }}</p>
              </div>
            </div>
            <button mat-stroked-button class="btn btn-secondary" (click)="generateNewKey()">{{ 'apiAccess.generateNewKey' | translate }}</button>
          </section>

          <section class="panel panel-status">
            <div class="panel-title">{{ 'hooks.title' | translate }}</div>
            <div class="hooks-list">
              <div class="hook-item">
                <span class="hook-name">{{ 'hooks.grafana' | translate }}</span>
                <span class="hook-state">{{ 'hooks.connected' | translate }}</span>
              </div>
              <div class="hook-item">
                <span class="hook-name">{{ 'hooks.sap' | translate }}</span>
                <span class="hook-state">{{ 'hooks.connected' | translate }}</span>
              </div>
            </div>
          </section>

          <section class="panel panel-metrics">
            <div class="panel-title">{{ 'throughput.title' | translate }}</div>
            <div class="throughput-chart" [style.background]="throughputDonutBackground()">
              <div class="throughput-chart__inner">
                <strong>75%</strong>
                <p>{{ 'throughput.monthlyLimit' | translate }}</p>
              </div>
            </div>
            <p class="throughput-meta">
              {{ 'throughput.requestsUsed' | translate }}
              {{ 'throughput.usageSummary' | translate:{ amount: apiUsageSummary() } }}
            </p>
          </section>

          <section class="panel panel-health">
            <div class="panel-title">{{ 'integrationHealth.title' | translate }}</div>
            <p class="panel-subtitle">{{ 'integrationHealth.description' | translate }}</p>
            <div class="health-mini-grid">
              <article class="health-mini-card">
                <div class="health-mini-card__icon health-mini-card__icon--grafana">G</div>
                <div>
                  <strong>{{ 'hooks.grafana' | translate }}</strong>
                  <span>{{ 'integrationHealth.uptimeValue' | translate:{ percent: '99.8' } }}</span>
                </div>
                <span class="health-mini-card__status">{{ 'integrationHealth.healthy' | translate }}</span>
              </article>
              <article class="health-mini-card">
                <div class="health-mini-card__icon health-mini-card__icon--sap">S</div>
                <div>
                  <strong>{{ 'integrationHealth.sapErp' | translate }}</strong>
                  <span>{{ 'integrationHealth.uptimeValue' | translate:{ percent: '99.9' } }}</span>
                </div>
                <span class="health-mini-card__status">{{ 'integrationHealth.healthy' | translate }}</span>
              </article>
            </div>
          </section>
        </aside>
      </div>

      <section class="panel panel-docs">
          <div class="panel-title">{{ 'businessProfile.taxCreditDocumentation' | translate }}</div>
          <div class="doc-grid">
            <div class="doc-item">
              <div>
                <p class="doc-type">{{ 'businessProfile.documents.form3468Short' | translate }}</p>
                <p class="doc-status">{{ 'businessProfile.documents.form3468Subtitle' | translate }}</p>
              </div>
              <span class="doc-badge">{{ 'businessProfile.verified' | translate }}</span>
            </div>
            <div class="doc-item">
              <div>
                <p class="doc-type">{{ 'businessProfile.documents.solarAuditShort' | translate }}</p>
                <p class="doc-status">{{ 'businessProfile.documents.solarAuditSite' | translate }}</p>
              </div>
              <span class="doc-badge secondary">{{ 'businessProfile.pendingReview' | translate }}</span>
            </div>
            <div class="doc-item" *ngFor="let doc of uploadedDocuments()">
              <div>
                <p class="doc-type">{{ doc.name }}</p>
                <p class="doc-status">{{ doc.uploadedAt }}</p>
              </div>
              <span class="doc-badge secondary">{{ 'businessProfile.pendingReview' | translate }}</span>
            </div>
          </div>
          <input #docInput type="file" accept=".pdf,.doc,.docx" hidden (change)="onDocumentSelected($event)" />
          <button mat-stroked-button class="btn btn-secondary" (click)="uploadDocumentation()">{{ 'businessProfile.uploadNewDocumentation' | translate }}</button>
      </section>

      <section class="panel panel-upgrade">
        <div>
          <p class="panel-title">{{ 'businessProfile.upgradeCtaTitle' | translate }}</p>
          <p class="panel-description">{{ 'businessProfile.upgradeCtaDescription' | translate }}</p>
        </div>
        <button mat-flat-button color="primary" class="btn btn-primary" (click)="openUpgradeModal()">{{ 'buttons.upgradeNow' | translate }}</button>
      </section>

      <div class="modal-backdrop" *ngIf="showUpgradeModal()" (click)="closeUpgradeModal()">
        <div class="upgrade-modal" (click)="$event.stopPropagation()">
          <h3>{{ 'businessProfile.upgradeCtaTitle' | translate }}</h3>
          <p>{{ 'businessProfile.upgradeCtaDescription' | translate }}</p>
          <div class="upgrade-modal__actions">
            <button type="button" mat-stroked-button class="btn btn-secondary" (click)="closeUpgradeModal()">{{ 'common.cancel' | translate }}</button>
            <button type="button" mat-flat-button color="primary" class="btn btn-primary" (click)="submitUpgrade()">{{ 'buttons.upgradeNow' | translate }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: grid;
      gap: 2rem;
      animation: integrationsPageIn 0.45s ease;
    }
    @keyframes integrationsPageIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .integrations-animate {
      animation: integrationsFadeUp 0.5s ease both;
    }
    .integrations-animate--down {
      animation-name: integrationsFadeDown;
    }
    .integrations-animate--left {
      animation-name: integrationsFadeLeft;
    }
    .integrations-animate--up {
      animation-name: integrationsFadeUp;
    }
    @keyframes integrationsFadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes integrationsFadeDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes integrationsFadeLeft {
      from { opacity: 0; transform: translateX(12px); }
      to { opacity: 1; transform: translateX(0); }
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1.25rem;
    }
    .page-eyebrow {
      color: var(--secondary-color);
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      margin-bottom: 0.75rem;
    }
    .page-header h1 {
      margin: 0;
      font-size: 2.8rem;
      color: var(--gray-900);
      line-height: 1.05;
    }
    .page-description {
      margin-top: 1rem;
      color: var(--gray-600);
      max-width: 55rem;
      font-size: 1rem;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.9fr) minmax(0, 1fr);
      gap: 1.75rem;
    }
    .panel {
      background: var(--surface);
      border: 1px solid rgba(90, 102, 129, 0.08);
      border-radius: 28px;
      box-shadow: var(--shadow-sm);
      padding: 1.75rem;
    }
    .panel-large {
      display: grid;
      gap: 1.25rem;
      align-content: start;
    }
    .panel-header {
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
    }
    .panel-header__icon {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      background: rgba(47, 108, 235, 0.1);
      color: var(--primary-color);
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .identity-stats {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.75rem;
    }
    .identity-stat {
      display: grid;
      gap: 0.2rem;
      padding: 0.75rem 0.85rem;
      border-radius: 16px;
      background: var(--surface-soft);
      border: 1px solid rgba(90, 102, 129, 0.08);
    }
    .identity-stat span {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--gray-500);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .identity-stat strong {
      font-size: 1.1rem;
      color: var(--gray-900);
    }
    .field-grid--two-col {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .compliance-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .compliance-chip {
      border-radius: 999px;
      padding: 0.35rem 0.75rem;
      background: rgba(47, 108, 235, 0.08);
      color: var(--gray-600);
      font-size: 0.76rem;
      font-weight: 700;
    }
    .compliance-chip--verified {
      background: #ecfdf5;
      color: #15803d;
    }
    .health-mini-grid {
      display: grid;
      gap: 0.75rem;
    }
    .health-mini-card {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 0.75rem;
      align-items: center;
      padding: 0.85rem;
      border-radius: 16px;
      background: var(--surface-soft);
      border: 1px solid rgba(90, 102, 129, 0.08);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .health-mini-card:hover {
      border-color: rgba(16, 185, 129, 0.35);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.08);
    }
    .health-mini-card__icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: grid;
      place-items: center;
      color: #fff;
      font-weight: 800;
    }
    .health-mini-card__icon--grafana {
      background: linear-gradient(135deg, #FF9830 0%, #FFB547 100%);
    }
    .health-mini-card__icon--sap {
      background: linear-gradient(135deg, #0066CC 0%, #0099FF 100%);
    }
    .health-mini-card strong {
      display: block;
      font-size: 0.88rem;
      color: var(--gray-900);
    }
    .health-mini-card span {
      display: block;
      margin-top: 0.15rem;
      font-size: 0.76rem;
      color: var(--gray-500);
    }
    .health-mini-card__status {
      font-size: 0.72rem;
      font-weight: 700;
      color: #15803d;
      white-space: nowrap;
    }
    .throughput-chart {
      width: 120px;
      height: 120px;
      margin: 0 auto 0.75rem;
      border-radius: 50%;
      display: grid;
      place-items: center;
      transition: transform 0.25s ease;
    }
    .throughput-chart:hover {
      transform: scale(1.03);
    }
    .throughput-chart__inner {
      width: 84px;
      height: 84px;
      border-radius: 50%;
      background: var(--surface);
      display: grid;
      place-items: center;
      text-align: center;
    }
    .throughput-chart__inner strong {
      font-size: 1.35rem;
      color: var(--gray-900);
    }
    .throughput-chart__inner p {
      margin: 0;
      font-size: 0.68rem;
      color: var(--gray-500);
      font-weight: 700;
    }
    .panel-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--gray-900);
      margin-bottom: 1rem;
    }
    .panel-subtitle {
      color: var(--gray-500);
      margin-bottom: 1.5rem;
      line-height: 1.7;
    }
    .field-grid {
      display: grid;
      gap: 1rem;
    }
    .field-row {
      display: grid;
      gap: 0.5rem;
    }
    .field-row.full-width {
      grid-column: 1 / -1;
    }
    label {
      color: var(--gray-600);
      font-size: 0.93rem;
      font-weight: 600;
    }
    input {
      width: 100%;
      padding: 1rem 1.1rem;
      border-radius: 18px;
      border: 1px solid rgba(90, 102, 129, 0.12);
      background: var(--surface-soft);
      color: var(--gray-900);
    }
    input[readonly] {
      opacity: 0.9;
    }
    .panel-column {
      display: grid;
      gap: 1.5rem;
    }
    .key-card {
      border-radius: 22px;
      background: var(--surface-soft);
      padding: 1.25rem;
      border: 1px solid rgba(90, 102, 129, 0.08);
      display: grid;
      gap: 0.65rem;
    }
    .key-label {
      display: block;
      color: var(--gray-500);
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.12em;
    }
    .key-value {
      margin: 0;
      color: var(--gray-800);
      font-size: 1rem;
      font-weight: 700;
      word-break: break-all;
    }
    .hooks-list {
      display: grid;
      gap: 1rem;
    }
    .hook-item {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      background: var(--surface-soft);
      border: 1px solid rgba(90, 102, 129, 0.08);
      border-radius: 18px;
      padding: 1rem 1.15rem;
    }
    .hook-name {
      color: var(--gray-900);
      font-weight: 700;
    }
    .hook-state {
      color: var(--success-color);
      font-weight: 700;
    }
    .throughput-chart {
      display: grid;
      gap: 0.5rem;
      padding: 1rem 1.2rem;
      border-radius: 20px;
      background: linear-gradient(180deg, rgba(47,108,235,0.12) 0%, rgba(255,255,255,0.95) 100%);
    }
    .throughput-chart strong {
      font-size: 2rem;
      display: block;
      color: var(--primary-strong);
    }
    .throughput-chart p {
      margin: 0;
      color: var(--gray-500);
    }
    .throughput-meta {
      margin-top: 1rem;
      color: var(--gray-600);
      font-size: 0.95rem;
      line-height: 1.7;
    }
    .doc-grid {
      display: grid;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .doc-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.15rem 1.25rem;
      border-radius: 20px;
      border: 1px solid rgba(90, 102, 129, 0.1);
      background: var(--surface-soft);
    }
    .doc-type {
      margin: 0;
      font-weight: 700;
      color: var(--gray-900);
    }
    .doc-status {
      margin: 0.25rem 0 0;
      color: var(--gray-500);
      font-size: 0.95rem;
    }
    .doc-badge {
      padding: 0.55rem 0.95rem;
      border-radius: 14px;
      background: rgba(47, 108, 235, 0.12);
      color: var(--primary-color);
      font-weight: 700;
      font-size: 0.85rem;
    }
    .doc-badge.secondary {
      background: rgba(47, 108, 235, 0.08);
      color: var(--gray-600);
    }
    .panel-docs .btn-secondary {
      width: fit-content;
    }
    .panel-upgrade {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 1.35rem 1.75rem;
      background: linear-gradient(135deg, rgba(47,108,235,0.14) 0%, rgba(47,108,235,0.05) 100%);
      border: 1px solid rgba(47, 108, 235, 0.12);
    }
    .panel-upgrade .panel-title {
      margin-bottom: 0.5rem;
    }
    .panel-upgrade .panel-description {
      margin: 0;
      color: var(--gray-600);
      max-width: 44rem;
    }
    .btn {
      cursor: pointer;
      border: none;
      border-radius: 14px;
      padding: 0.85rem 1.2rem;
      font-weight: 700;
    }
    .btn-primary {
      background: var(--primary-color);
      color: #fff;
    }
    .btn-secondary {
      background: rgba(47, 108, 235, 0.1);
      color: var(--primary-color);
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      z-index: 1200;
    }
    .upgrade-modal {
      width: min(100%, 480px);
      background: var(--white);
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: var(--shadow-lg);
    }
    .upgrade-modal h3 {
      margin: 0 0 0.5rem;
    }
    .upgrade-modal p {
      margin: 0 0 1rem;
      color: var(--gray-600);
    }
    .upgrade-modal__actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
    @media (max-width: 1024px) {
      .summary-grid {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
      }
      .page-header h1 {
        font-size: clamp(1.5rem, 6vw, 2.8rem);
      }
      .page-header button {
        width: 100%;
      }
      .panel {
        padding: 1.25rem;
        border-radius: 20px;
      }
      .panel-upgrade {
        flex-direction: column;
        align-items: stretch;
      }
      .doc-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }
    }
  `]
})
export class IntegrationsComponent implements OnInit {
  @ViewChild('docInput') docInput?: ElementRef<HTMLInputElement>;

  private readonly feedback = inject(UiFeedbackService);
  private readonly translate = inject(TranslateService);

  businessName = signal('Sterling Energy Solutions LLC');
  tin = signal('XX-XXXX5678');
  address = signal('452 Innovation Way, Ste 300, Palo Alto, CA 94304');
  apiKey = signal('dc_live_7294_bb12_9xae_0012_pq89');
  readonly uploadedDocuments = signal<UploadedDocument[]>([]);
  readonly showUpgradeModal = signal(false);

  ngOnInit(): void {
    this.loadSavedConfiguration();
  }

  apiUsageSummary(): string {
    return '5M';
  }

  throughputDonutBackground(): string {
    return 'conic-gradient(var(--primary-color) 0 75%, rgba(90, 102, 129, 0.12) 75% 100%)';
  }

  saveConfiguration(): void {
    const payload = {
      businessName: this.businessName(),
      tin: this.tin(),
      address: this.address(),
      apiKey: this.apiKey(),
      documents: this.uploadedDocuments(),
    };
    localStorage.setItem(INTEGRATIONS_STORAGE_KEY, JSON.stringify(payload));
    this.feedback.showToast(this.translate.instant('integrations.toast.configSaved'), 'success');
  }

  generateNewKey(): void {
    if (!this.feedback.confirmAction(this.translate.instant('common.confirm.generateApiKey'))) return;

    const suffix = Math.random().toString(36).slice(2, 10);
    this.apiKey.set(`dc_live_${suffix}_regenerated`);
    this.feedback.showToast(this.translate.instant('integrations.toast.keyGenerated'), 'success');
  }

  uploadDocumentation(): void {
    this.docInput?.nativeElement.click();
  }

  onDocumentSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.uploadedDocuments.update(docs => [
      ...docs,
      {
        name: file.name,
        uploadedAt: new Date().toLocaleDateString(),
      },
    ]);
    this.feedback.showToast(this.translate.instant('integrations.toast.fileUploaded', { name: file.name }), 'success');
    (event.target as HTMLInputElement).value = '';
  }

  openUpgradeModal(): void {
    this.showUpgradeModal.set(true);
  }

  closeUpgradeModal(): void {
    this.showUpgradeModal.set(false);
  }

  submitUpgrade(): void {
    this.closeUpgradeModal();
    this.feedback.showToast(this.translate.instant('integrations.toast.upgradeSubmitted'), 'success');
  }

  private loadSavedConfiguration(): void {
    const raw = localStorage.getItem(INTEGRATIONS_STORAGE_KEY);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw) as {
        businessName?: string;
        tin?: string;
        address?: string;
        apiKey?: string;
        documents?: UploadedDocument[];
      };
      if (saved.businessName) this.businessName.set(saved.businessName);
      if (saved.tin) this.tin.set(saved.tin);
      if (saved.address) this.address.set(saved.address);
      if (saved.apiKey) this.apiKey.set(saved.apiKey);
      if (saved.documents?.length) this.uploadedDocuments.set(saved.documents);
    } catch {
      // Ignore invalid persisted config.
    }
  }
}
