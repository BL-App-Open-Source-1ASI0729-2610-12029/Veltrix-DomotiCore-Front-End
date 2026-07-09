import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BusinessUsersNavComponent } from '../../../../team-management/presentation/components/business-users-nav/business-users-nav.component';
import { GOOGLE_ICONS } from '../../../../shared/constants/google-icons';
import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';
import { downloadTextFile } from '../../../../shared/utils/download-file.util';
import { MATERIAL_IMPORTS } from '../../../../shared/material';
import { BusinessProfileStore } from '../../../application/business-profile.store';
import {
  BusinessProfile,
  DEFAULT_BUSINESS_PROFILE,
  DocumentStatus,
  ProviderState,
  SyncInterval,
  TaxDocument,
  WebhookItem,
} from '../../../domain/model/business-profile.entity';

type ProfileModal = 'connection' | 'backup' | 'sync' | 'webhook' | 'upgrade' | null;

@Component({
  selector: 'app-business-profile-api-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, BusinessUsersNavComponent, ...MATERIAL_IMPORTS],
  template: `
    <div class="container">
      <app-business-users-nav />

      <div class="page-top">
        <div class="breadcrumb">{{ 'businessProfile.breadcrumb' | translate }}</div>
        <div class="page-heading">
          <h1>{{ 'businessProfile.title' | translate }}</h1>
          <p class="description">{{ 'businessProfile.description' | translate }}</p>
        </div>
      </div>

      <div class="main-content">
        <div class="left-column">
          <mat-card class="card content-card">
            <mat-card-content>
            <div class="card-header">
              <div class="card-title">
                <span class="card-icon card-icon--blue">
                  <img [src]="icons.briefcase" alt="" class="ui-icon ui-icon--md" />
                </span>
                <div class="card-title-text">
                  <h2>{{ 'businessProfile.corporateIdentity' | translate }}</h2>
                  <p>{{ 'businessProfile.corporateIdentityDesc' | translate }}</p>
                </div>
              </div>
            </div>

            <div class="form-grid">
              <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic">
                <mat-label>{{ 'businessProfile.legalBusinessName' | translate }}</mat-label>
                <input matInput id="businessName" type="text" [(ngModel)]="businessName" name="businessName">
              </mat-form-field>
              <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic">
                <mat-label>{{ 'businessProfile.tin' | translate }}</mat-label>
                <input matInput id="tin" type="text" [(ngModel)]="tin" name="tin">
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width" floatLabel="always" subscriptSizing="dynamic">
                <mat-label>{{ 'businessProfile.headquartersAddress' | translate }}</mat-label>
                <input matInput id="address" type="text" [(ngModel)]="address" name="address">
              </mat-form-field>
            </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="card content-card">
            <mat-card-content>
            <div class="card-header gap-header">
              <div class="card-title">
                <span class="card-icon card-icon--green">
                  <img [src]="icons.shield" alt="" class="ui-icon ui-icon--md" />
                </span>
                <div class="card-title-text">
                  <h2>{{ 'businessProfile.utilityProviderIntegration' | translate }}</h2>
                  <p>{{ 'businessProfile.utilityProviderDesc' | translate }}</p>
                </div>
              </div>
              <span [class]="providerStatusClass()">{{ providerStatusKey() | translate }}</span>
            </div>

            <div class="provider-panel">
              <div class="provider-card-inner">
                <div class="provider-item">
                  <div class="provider-brand" aria-hidden="true">
                    <span class="provider-brand__label">{{ 'businessProfile.samples.pgeBrand' | translate }}</span>
                  </div>
                  <div class="provider-details">
                    <strong>{{ provider().nameKey | translate }}</strong>
                    <span>{{ 'businessProfile.accountSummary' | translate:{ accountId: provider().accountId, rateSchedule: provider().rateSchedule } }}</span>
                    <span class="provider-backup" *ngIf="provider().backupProvider">
                      {{ 'businessProfile.backupProvider' | translate }}: {{ provider().backupProvider | translate }}
                    </span>
                  </div>
                </div>
                <button mat-stroked-button color="primary" type="button" class="btn-outline btn-press" (click)="openConnectionModal()">{{ 'businessProfile.manageConnection' | translate }}</button>
              </div>

              <div class="sync-pill">
                {{ 'businessProfile.currentSyncInterval' | translate }}: {{ syncInterval() }} {{ 'businessProfile.minutes' | translate }}
              </div>

              <div class="quick-actions">
                <button matRipple type="button" class="btn-dashed btn-press" (click)="openBackupModal()">{{ 'businessProfile.connectBackupProvider' | translate }}</button>
                <button matRipple type="button" class="btn-dashed btn-press" (click)="openSyncModal()">{{ 'businessProfile.syncIntervalSettings' | translate }}</button>
              </div>
            </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="card content-card">
            <mat-card-content>
            <div class="card-header">
              <div class="card-title">
                <span class="card-icon card-icon--gray">
                  <img [src]="icons.receipt" alt="" class="ui-icon ui-icon--md" />
                </span>
                <div class="card-title-text">
                  <h2>{{ 'businessProfile.taxCreditDocumentation' | translate }}</h2>
                  <p>{{ 'businessProfile.taxCreditDesc' | translate }}</p>
                </div>
              </div>
            </div>

            <div class="document-list">
              <div class="document-item" *ngFor="let document of documents()">
                <span class="doc-icon">
                  <img [src]="icons.receipt" alt="" class="ui-icon ui-icon--md" />
                </span>
                <div class="doc-info">
                  <span class="doc-name">{{ documentDisplayName(document) }}</span>
                  <span class="doc-subtitle">
                    {{ documentStatusKey(document.status) | translate }} · {{ formatUploadedLabel(document) }}
                  </span>
                </div>
                <button type="button" mat-icon-button class="download-btn" (click)="downloadDocument(document)" [attr.aria-label]="'businessProfile.downloadDocument' | translate">
                  <img [src]="icons.download" alt="" class="ui-icon ui-icon--sm" />
                </button>
              </div>
            </div>

            <input #docInput type="file" accept=".pdf,.doc,.docx" hidden (change)="onDocumentSelected($event)" />
            <button mat-stroked-button class="btn-upload btn-press" (click)="uploadDocumentation()">{{ 'businessProfile.uploadNewDocumentation' | translate }}</button>
            </mat-card-content>
          </mat-card>
        </div>

        <aside class="right-column">
          <section class="widget api-widget">
            <div class="widget-title">
              <h3>{{ 'apiAccess.title' | translate }}</h3>
              <p>{{ 'apiAccess.description' | translate }}</p>
            </div>

            <div class="api-card">
              <span class="api-label">{{ 'apiAccess.primaryMonitoringKey' | translate }}</span>
              <div class="api-key-value">{{ apiKey() }}</div>
            </div>

            <button mat-stroked-button type="button" class="btn-white btn-press" (click)="generateNewKey()">{{ 'apiAccess.generateNewKey' | translate }}</button>
            <button mat-button color="primary" type="button" class="btn-copy-key btn-press" (click)="copyApiKey()">{{ 'businessProfile.copyApiKey' | translate }}</button>
          </section>

          <section class="widget hooks-widget">
            <h3>{{ 'hooks.title' | translate }}</h3>
            <div class="hooks-list">
              <div class="hook-item" *ngFor="let hook of webhooks()">
                <div class="hook-left">
                  <span class="status-dot" [class.active]="hook.connected && hook.enabled"></span>
                  <div class="hook-meta">
                    <strong>{{ hook.labelKey | translate }}</strong>
                    <span>{{ hookStatusLabel(hook) | translate }}</span>
                  </div>
                </div>
                <button type="button" mat-icon-button class="settings-icon btn-press" (click)="openWebhookModal(hook.id)">
                  <img [src]="icons.settings" alt="" class="ui-icon ui-icon--sm" />
                </button>
              </div>
            </div>
          </section>

          <section class="widget status-widget">
            <h3>{{ 'integrationHealth.title' | translate }}</h3>
            <p>{{ 'integrationHealth.description' | translate }}</p>
            <div class="health-indicators">
              <div class="health-card">
                <div class="health-icon grafana">G</div>
                <div class="health-info">
                  <span class="health-label">{{ 'hooks.grafana' | translate }}</span>
                  <span class="health-status healthy">{{ 'integrationHealth.healthy' | translate }}</span>
                </div>
                <span class="uptime">{{ 'integrationHealth.uptimeValue' | translate:{ percent: '99.8' } }}</span>
              </div>
              <div class="health-card">
                <div class="health-icon sap">S</div>
                <div class="health-info">
                  <span class="health-label">{{ 'integrationHealth.sapErp' | translate }}</span>
                  <span class="health-status healthy">{{ 'integrationHealth.healthy' | translate }}</span>
                </div>
                <span class="uptime">{{ 'integrationHealth.uptimeValue' | translate:{ percent: '99.9' } }}</span>
              </div>
            </div>
          </section>

          <section class="widget throughput-widget">
            <h3>{{ 'throughput.title' | translate }}</h3>
            <div class="donut-chart" [style.background]="donutBackground()">
              <div class="donut-inner">
                <span class="percentage">{{ apiUsagePercent() }}%</span>
                <span class="label">{{ 'throughput.monthlyLimit' | translate }}</span>
              </div>
            </div>
            <p class="throughput-footer">
              {{ 'throughput.requestsUsed' | translate }}
              {{ 'throughput.usageAmount' | translate:apiUsageAmountParams() }}
              {{ 'businessProfile.enterpriseQuota' | translate }}
            </p>
          </section>

          <section class="upgrade-banner">
            <div class="upgrade-content">
              <h3>{{ 'businessProfile.upgradeCtaTitle' | translate }}</h3>
              <p>{{ 'businessProfile.upgradeCtaDescription' | translate }}</p>
              <button mat-stroked-button type="button" class="btn-white btn-press" (click)="openUpgradeModal()">{{ 'buttons.upgradeNow' | translate }}</button>
            </div>
          </section>
        </aside>
      </div>

      <div class="footer-actions">
        <button mat-button color="primary" type="button" class="btn-text" (click)="discardChanges()" [disabled]="!isDirty()">{{ 'buttons.discardChanges' | translate }}</button>
        <button mat-flat-button color="primary" class="btn-primary btn-press" (click)="saveConfiguration()" [disabled]="!isDirty()">{{ 'buttons.saveConfiguration' | translate }}</button>
      </div>
    </div>

    <div class="modal-backdrop" *ngIf="activeModal() === 'connection'" (click)="closeModal()">
      <div class="profile-modal" (click)="$event.stopPropagation()">
        <div class="profile-modal__header">
          <h3>{{ 'businessProfile.modals.connection.title' | translate }}</h3>
          <button type="button" mat-icon-button class="profile-modal__close" (click)="closeModal()" [attr.aria-label]="'common.a11y.close' | translate">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <p class="profile-modal__intro">{{ 'businessProfile.modals.connection.description' | translate }}</p>
        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>{{ 'businessProfile.modals.connection.accountId' | translate }}</mat-label>
          <input matInput type="text" [(ngModel)]="connectionDraft.accountId" name="connectionAccountId" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>{{ 'businessProfile.modals.connection.rateSchedule' | translate }}</mat-label>
          <input matInput type="text" [(ngModel)]="connectionDraft.rateSchedule" name="connectionRateSchedule" />
        </mat-form-field>
        <label class="profile-modal__toggle">
          <input type="checkbox" [(ngModel)]="connectionDraft.connected" name="connectionConnected" />
          <span>{{ 'businessProfile.modals.connection.keepConnected' | translate }}</span>
        </label>
        <div class="profile-modal__actions">
          <button type="button" mat-stroked-button class="btn-secondary" (click)="closeModal()">{{ 'buttons.cancel' | translate }}</button>
          <button type="button" mat-flat-button color="primary" class="btn-primary" (click)="saveConnection()">{{ 'businessProfile.modals.connection.save' | translate }}</button>
        </div>
      </div>
    </div>

    <div class="modal-backdrop" *ngIf="activeModal() === 'backup'" (click)="closeModal()">
      <div class="profile-modal" (click)="$event.stopPropagation()">
        <div class="profile-modal__header">
          <h3>{{ 'businessProfile.modals.backup.title' | translate }}</h3>
          <button type="button" mat-icon-button class="profile-modal__close" (click)="closeModal()" [attr.aria-label]="'common.a11y.close' | translate">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <p class="profile-modal__intro">{{ 'businessProfile.modals.backup.description' | translate }}</p>
        <div class="provider-options">
          <button
            type="button"
            mat-stroked-button
            class="provider-option"
            *ngFor="let option of backupProviderOptions"
            [class.provider-option--active]="selectedBackupProvider === option"
            (click)="selectedBackupProvider = option"
          >
            {{ option | translate }}
          </button>
        </div>
        <div class="profile-modal__actions">
          <button type="button" mat-stroked-button class="btn-secondary" (click)="closeModal()">{{ 'buttons.cancel' | translate }}</button>
          <button type="button" mat-flat-button color="primary" class="btn-primary" (click)="saveBackupProvider()" [disabled]="!selectedBackupProvider">
            {{ 'businessProfile.modals.backup.connect' | translate }}
          </button>
        </div>
      </div>
    </div>

    <div class="modal-backdrop" *ngIf="activeModal() === 'sync'" (click)="closeModal()">
      <div class="profile-modal" (click)="$event.stopPropagation()">
        <div class="profile-modal__header">
          <h3>{{ 'businessProfile.modals.sync.title' | translate }}</h3>
          <button type="button" mat-icon-button class="profile-modal__close" (click)="closeModal()" [attr.aria-label]="'common.a11y.close' | translate">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <p class="profile-modal__intro">{{ 'businessProfile.modals.sync.description' | translate }}</p>
        <div class="sync-options">
          <label class="sync-option" *ngFor="let interval of syncIntervalOptions">
            <input type="radio" name="syncInterval" [value]="interval" [(ngModel)]="syncIntervalDraft" />
            <span>{{ interval }} {{ 'businessProfile.minutes' | translate }}</span>
          </label>
        </div>
        <div class="profile-modal__actions">
          <button type="button" mat-stroked-button class="btn-secondary" (click)="closeModal()">{{ 'buttons.cancel' | translate }}</button>
          <button type="button" mat-flat-button color="primary" class="btn-primary" (click)="saveSyncInterval()">{{ 'businessProfile.modals.sync.save' | translate }}</button>
        </div>
      </div>
    </div>

    <div class="modal-backdrop" *ngIf="activeModal() === 'webhook' && activeWebhook() as hook" (click)="closeModal()">
      <div class="profile-modal" (click)="$event.stopPropagation()">
        <div class="profile-modal__header">
          <h3>{{ 'businessProfile.modals.webhook.title' | translate:{ name: (hook.labelKey | translate) } }}</h3>
          <button type="button" mat-icon-button class="profile-modal__close" (click)="closeModal()" [attr.aria-label]="'common.a11y.close' | translate">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>{{ 'businessProfile.modals.webhook.endpoint' | translate }}</mat-label>
          <input matInput type="url" [(ngModel)]="webhookDraft.url" name="webhookUrl" />
        </mat-form-field>
        <label class="profile-modal__toggle">
          <input type="checkbox" [(ngModel)]="webhookDraft.enabled" name="webhookEnabled" />
          <span>{{ 'businessProfile.modals.webhook.enabled' | translate }}</span>
        </label>
        <div class="profile-modal__actions">
          <button type="button" mat-stroked-button class="btn-secondary" (click)="closeModal()">{{ 'buttons.cancel' | translate }}</button>
          <button type="button" mat-stroked-button color="primary" class="btn-outline-modal" (click)="testWebhook()">{{ 'businessProfile.modals.webhook.test' | translate }}</button>
          <button type="button" mat-flat-button color="primary" class="btn-primary" (click)="saveWebhook()" [disabled]="!webhookDraft.url.trim()">
            {{ 'businessProfile.modals.webhook.save' | translate }}
          </button>
        </div>
      </div>
    </div>

    <div class="modal-backdrop" *ngIf="activeModal() === 'upgrade'" (click)="closeModal()">
      <div class="profile-modal profile-modal--upgrade" (click)="$event.stopPropagation()">
        <div class="profile-modal__header">
          <h3>{{ 'businessProfile.modals.upgrade.title' | translate }}</h3>
          <button type="button" mat-icon-button class="profile-modal__close" (click)="closeModal()" [attr.aria-label]="'common.a11y.close' | translate">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <p class="profile-modal__intro">{{ 'businessProfile.modals.upgrade.description' | translate }}</p>
        <ul class="upgrade-benefits">
          <li>{{ 'businessProfile.modals.upgrade.benefit1' | translate }}</li>
          <li>{{ 'businessProfile.modals.upgrade.benefit2' | translate }}</li>
          <li>{{ 'businessProfile.modals.upgrade.benefit3' | translate }}</li>
        </ul>
        <div class="profile-modal__actions">
          <button type="button" mat-stroked-button class="btn-secondary" (click)="closeModal()">{{ 'buttons.cancel' | translate }}</button>
          <button type="button" mat-flat-button color="primary" class="btn-primary" (click)="submitUpgrade()">{{ 'businessProfile.modals.upgrade.submit' | translate }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      display: grid;
      gap: 0.25rem;
      padding-bottom: 1rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .page-top {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      margin-bottom: 2rem;
    }

    .breadcrumb {
      color: #4B5563;
      font-size: 0.78rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 700;
    }

    .page-heading h1 {
      margin: 0;
      font-size: 2.4rem;
      font-weight: 800;
      color: #111827;
      line-height: 1.05;
    }

    .description {
      margin: 0.5rem 0 0;
      color: #6B7280;
      font-size: 1rem;
      line-height: 1.75;
      max-width: 720px;
    }

    .main-content {
      display: grid;
      grid-template-columns: 70% 30%;
      gap: 2rem;
      margin-bottom: 4rem;
    }

    .left-column,
    .right-column {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .card,
    .widget,
    .upgrade-banner {
      border-radius: 16px;
      background: white;
      border: 1px solid #E5E7EB;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
    }

    .card {
      padding: 0;
      overflow: hidden;
    }

    .card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.25rem;
      width: 100%;
    }

    .gap-header {
      align-items: center;
    }

    .card-title {
      display: flex;
      align-items: center;
      gap: 0.95rem;
    }

    .card-icon {
      display: grid;
      place-items: center;
      width: 42px;
      height: 42px;
      border-radius: 12px;
      flex-shrink: 0;
    }

    .card-icon--blue {
      background: #eef3ff;
    }

    .card-icon--green {
      background: #ecfdf5;
    }

    .card-icon--gray {
      background: #f3f4f6;
    }

    .card-title-text h2 {
      margin: 0;
      font-size: 1.18rem;
      color: #111827;
      font-weight: 800;
    }

    .card-title-text p {
      margin: 0.35rem 0 0;
      color: #6B7280;
      font-size: 0.94rem;
      line-height: 1.6;
    }

    .badge-connected,
    .badge-disconnected {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 0.9rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 700;
      white-space: nowrap;
    }

    .badge-connected {
      background: #ECFDF5;
      color: #065F46;
      border: 1px solid #D1FAE5;
    }

    .badge-disconnected {
      background: #FEF2F2;
      color: #991B1B;
      border: 1px solid #FECACA;
    }

    .provider-backup,
    .sync-pill {
      color: #64748B;
      font-size: 0.84rem;
      line-height: 1.5;
    }

    .sync-pill {
      padding: 0.55rem 0.75rem;
      border-radius: 10px;
      background: #EEF2FF;
      color: #1A3EB7;
      font-weight: 700;
      width: fit-content;
    }

    .btn-press:active {
      transform: scale(0.98);
    }

    .btn-copy-key {
      width: 100%;
      margin-top: 0.65rem;
      border: 1px solid rgba(255, 255, 255, 0.35);
      background: rgba(255, 255, 255, 0.12);
      color: white;
      border-radius: 12px;
      padding: 0.7rem 1rem;
      font-weight: 700;
      cursor: pointer;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.25rem 1.25rem;
      align-items: start;
    }

    .form-grid mat-form-field {
      width: 100%;
      margin: 0;
    }

    .form-grid .full-width {
      grid-column: 1 / -1;
    }

    .profile-modal mat-form-field {
      width: 100%;
      display: block;
      margin-bottom: 0.5rem;
    }

    .provider-panel {
      display: grid;
      gap: 1rem;
    }

    .provider-card-inner {
      display: grid;
      gap: 1rem;
      padding: 1.3rem;
      border-radius: 18px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
    }

    .provider-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .provider-brand {
      display: grid;
      place-items: center;
      width: 58px;
      height: 58px;
      border-radius: 16px;
      background: #1a3b8b;
      flex-shrink: 0;
      box-shadow: 0 8px 18px rgba(26, 59, 139, 0.22);
    }

    .provider-brand__label {
      color: #fff;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1;
      text-align: center;
    }

    .provider-details {
      display: grid;
      gap: 0.25rem;
    }

    .provider-details strong {
      font-size: 1rem;
      color: #111827;
      font-weight: 700;
    }

    .provider-details span {
      color: #6B7280;
      font-size: 0.91rem;
      line-height: 1.5;
    }

    .btn-outline,
    .btn-white,
    .btn-primary {
      border-radius: 14px;
      font-size: 0.95rem;
      font-weight: 700;
    }

    .btn-outline {
      padding: 0.95rem 1rem;
      border: 1px solid #D1D5DB;
      background: #FFFFFF;
      color: #111827;
      cursor: pointer;
      transition: background 0.2s ease, border-color 0.2s ease;
      justify-self: start;
    }

    .btn-outline:hover {
      background: #F8FAFC;
      border-color: #9CA3AF;
    }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
    }

    .btn-dashed {
      width: 100%;
      padding: 0.95rem 1rem;
      border: 1.5px dashed #D1D5DB;
      background: #FFFFFF;
      color: #334155;
      cursor: pointer;
      text-align: left;
      border-radius: 16px;
      font-family: inherit;
      font-size: 0.95rem;
      font-weight: 700;
      appearance: none;
      transition: background 0.2s ease, border-color 0.2s ease;
    }

    .btn-dashed:hover {
      background: #F8FAFC;
      border-color: #9CA3AF;
    }

    .document-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      margin-bottom: 1.25rem;
    }

    .document-item {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border: 1px solid #E5E7EB;
      border-radius: 16px;
      background: #FFFFFF;
    }

    .doc-icon {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #eef3ff;
      flex-shrink: 0;
    }

    .doc-info {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .doc-name {
      color: #111827;
      font-size: 0.96rem;
      font-weight: 700;
      line-height: 1.3;
    }

    .doc-subtitle {
      color: #64748B;
      font-size: 0.83rem;
      display: inline-flex;
      gap: 0.45rem;
      flex-wrap: wrap;
    }

    .download-btn {
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      cursor: pointer;
      opacity: 0.78;
      transition: opacity 0.2s ease;
      padding: 0;
    }

    .download-btn:hover {
      opacity: 1;
    }

    .btn-upload {
      width: 100%;
      padding: 1rem;
      border: 1.5px dashed #D1D5DB;
      background: #FFFFFF;
      color: #334155;
      border-radius: 16px;
      cursor: pointer;
      transition: background 0.2s ease, border-color 0.2s ease;
    }

    .btn-upload:hover {
      background: #F8FAFC;
      border-color: #9CA3AF;
    }

    .widget {
      padding: 1.5rem;
    }

    .api-widget {
      background: #1A3EB7;
      color: white;
      border: none;
      position: relative;
      overflow: hidden;
    }

    .api-widget::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.18), transparent 30%);
      pointer-events: none;
    }

    .api-widget .widget-title {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      margin-bottom: 1.4rem;
    }

    .api-widget h3 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 800;
      color: white;
    }

    .api-widget p {
      margin: 0;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.94rem;
      line-height: 1.6;
    }

    .api-card {
      position: relative;
      z-index: 1;
      padding: 1rem;
      border-radius: 18px;
      border: 1px solid rgba(255, 255, 255, 0.18);
      background: rgba(255, 255, 255, 0.12);
      display: grid;
      gap: 0.85rem;
    }

    .api-label {
      font-size: 0.7rem;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.75);
      font-weight: 700;
    }

    .api-key-value {
      padding: 1rem;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.18);
      color: white;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
      font-size: 0.92rem;
      line-height: 1.5;
      word-break: break-all;
    }

    .api-widget .btn-white {
      width: 100%;
      margin-top: 1rem;
      background: white;
      color: #1A3EB7;
      border: none;
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12);
    }

    .hooks-widget h3,
    .throughput-widget h3 {
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
      color: #111827;
      font-weight: 800;
    }

    .hooks-list {
      display: grid;
      gap: 0.85rem;
    }

    .status-widget {
      padding: 1.5rem;
      border-radius: 16px;
      background: #F8FAFC;
      border: 1px solid #E5E7EB;
    }

    .status-widget h3 {
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
      font-weight: 800;
      color: #111827;
    }

    .status-widget p {
      margin: 0;
      color: #475569;
      line-height: 1.75;
      font-size: 0.95rem;
    }

    .health-indicators {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
      margin-top: 1.25rem;
    }

    .health-card {
      display: flex;
      align-items: center;
      gap: 0.95rem;
      padding: 1rem;
      border-radius: 16px;
      background: white;
      border: 1px solid #E5E7EB;
      transition: all 0.2s ease;
      position: relative;
    }

    .health-card:hover {
      border-color: #10B981;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.08);
    }

    .health-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-weight: 800;
      color: white;
      font-size: 1.1rem;
      position: relative;
    }

    .health-icon.grafana {
      background: linear-gradient(135deg, #FF9830 0%, #FFB547 100%);
    }

    .health-icon.sap {
      background: linear-gradient(135deg, #0066CC 0%, #0099FF 100%);
    }

    .health-card::after {
      content: '';
      position: absolute;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10B981;
      border: 2px solid white;
      bottom: 6px;
      right: 6px;
      box-shadow: 0 0 0 1px #E5E7EB;
    }

    .health-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
      min-width: 0;
    }

    .health-label {
      font-size: 0.92rem;
      font-weight: 700;
      color: #111827;
    }

    .health-status {
      font-size: 0.8rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .health-status::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
      flex-shrink: 0;
    }

    .health-status.healthy {
      color: #10B981;
    }

    .uptime {
      font-size: 0.8rem;
      color: #6B7280;
      white-space: nowrap;
      text-align: right;
    }

    @media (max-width: 600px) {
      .health-indicators {
        grid-template-columns: 1fr;
      }
    }

    .hook-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem;
      border-radius: 18px;
      background: #F8FAFC;
      border: 1px solid #E5E7EB;
    }

    .hook-left {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      min-width: 0;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      flex-shrink: 0;
    }

    .status-dot.active {
      background: #10B981;
    }

    .hook-meta {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      min-width: 0;
    }

    .hook-meta strong {
      font-size: 0.96rem;
      color: #111827;
      font-weight: 700;
    }

    .hook-meta span {
      font-size: 0.82rem;
      color: #64748B;
      line-height: 1.4;
    }

    .settings-icon {
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      opacity: 0.8;
      cursor: pointer;
      flex-shrink: 0;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .settings-icon img {
      width: 16px;
      height: 16px;
    }

    .throughput-widget {
      display: grid;
      gap: 1rem;
      text-align: center;
      padding-bottom: 1rem;
    }

    .donut-chart {
      width: 150px;
      height: 150px;
      margin: 0 auto;
      border-radius: 50%;
      background: conic-gradient(#1A3EB7 0% 75%, #E5E7EB 75% 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .donut-chart::before {
      content: '';
      position: absolute;
      width: 84px;
      height: 84px;
      border-radius: 50%;
      background: white;
    }

    .donut-inner {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.1rem;
    }

    .percentage {
      font-size: 1.8rem;
      font-weight: 800;
      color: #111827;
    }

    .label {
      font-size: 0.84rem;
      color: #64748B;
    }

    .throughput-footer {
      margin: 0;
      font-size: 0.88rem;
      color: #475569;
      line-height: 1.7;
    }

    .upgrade-banner {
      padding: 1.6rem;
      background: linear-gradient(180deg, #152773 0%, #1F4BB8 100%);
      color: white;
      position: relative;
      overflow: hidden;
      border: none;
    }

    .upgrade-banner::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.18), transparent 28%),
                  radial-gradient(circle at bottom left, rgba(255, 255, 255, 0.1), transparent 20%);
      pointer-events: none;
    }

    .upgrade-content {
      position: relative;
      z-index: 1;
      display: grid;
      gap: 1rem;
      text-align: left;
    }

    .upgrade-content h3 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 800;
    }

    .upgrade-content p {
      margin: 0;
      color: rgba(255, 255, 255, 0.92);
      font-size: 0.94rem;
      line-height: 1.7;
    }

    .footer-actions {
      position: sticky;
      bottom: 0;
      background: white;
      border-top: 1px solid #E5E7EB;
      padding: 1rem 2rem;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      box-shadow: 0 -10px 30px rgba(15, 23, 42, 0.06);
      z-index: 10;
    }

    .btn-text {
      padding: 0.95rem 1.25rem;
      background: transparent;
      border: none;
      color: #475569;
      font-weight: 700;
      cursor: pointer;
      transition: color 0.2s ease;
    }

    .btn-text:hover {
      color: #111827;
    }

    .btn-primary {
      padding: 0.95rem 1.25rem;
      background: #1A3EB7;
      color: white;
      border: none;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .btn-primary:hover {
      background: #1636A1;
    }

    .btn-primary:disabled,
    .btn-text:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      display: grid;
      place-items: center;
      padding: 1rem;
      z-index: 1300;
    }

    .profile-modal {
      width: min(100%, 480px);
      background: white;
      border-radius: 18px;
      border: 1px solid #E5E7EB;
      box-shadow: 0 24px 48px rgba(15, 23, 42, 0.2);
      padding: 1.25rem;
    }

    .profile-modal__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.85rem;
    }

    .profile-modal__header h3 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 800;
      color: #111827;
    }

    .profile-modal__close {
      width: 34px;
      height: 34px;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      background: #fff;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .profile-modal__intro {
      margin: 0 0 1rem;
      color: #6B7280;
      font-size: 0.88rem;
      line-height: 1.55;
    }

    .profile-modal__field {
      display: grid;
      gap: 0.35rem;
      margin-bottom: 0.85rem;
    }

    .profile-modal__field span {
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #6B7280;
    }

    .profile-modal__field input {
      border: 1px solid #D1D5DB;
      border-radius: 10px;
      padding: 0.65rem 0.75rem;
      font-size: 0.88rem;
    }

    .profile-modal__toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      font-size: 0.88rem;
      font-weight: 600;
      color: #374151;
    }

    .provider-options,
    .sync-options {
      display: grid;
      gap: 0.55rem;
      margin-bottom: 1rem;
    }

    .provider-option,
    .sync-option {
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 0.75rem 0.85rem;
      background: #F8FAFC;
      text-align: left;
      font-weight: 700;
      color: #111827;
      cursor: pointer;
    }

    .provider-option--active {
      border-color: #1A3EB7;
      background: #EEF2FF;
      color: #1A3EB7;
    }

    .sync-option {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      background: #fff;
    }

    .upgrade-benefits {
      margin: 0 0 1rem;
      padding-left: 1.1rem;
      color: #374151;
      font-size: 0.88rem;
      line-height: 1.6;
    }

    .profile-modal__actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.65rem;
      flex-wrap: wrap;
    }

    .btn-secondary,
    .btn-outline-modal {
      border: 1px solid #D1D5DB;
      border-radius: 10px;
      padding: 0.65rem 1rem;
      background: #fff;
      color: #374151;
      font-weight: 700;
      font-size: 0.84rem;
      cursor: pointer;
    }

    @media (max-width: 1120px) {
      .main-content {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 860px) {
      .container {
        padding: 1.25rem;
      }

      .page-heading h1 {
        font-size: 2rem;
      }

      .form-grid,
      .quick-actions {
        grid-template-columns: 1fr;
      }

      .card,
      .widget,
      .upgrade-banner {
        padding: 1.2rem;
      }

      .footer-actions {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `]
})
export class BusinessProfileApiSettingsComponent implements OnInit {
  @ViewChild('docInput') docInput?: ElementRef<HTMLInputElement>;

  readonly icons = GOOGLE_ICONS;
  readonly backupProviderOptions = [
    'businessProfile.backupProviders.sce',
    'businessProfile.backupProviders.sdge',
    'businessProfile.backupProviders.smud',
  ];
  readonly syncIntervalOptions: SyncInterval[] = [15, 30, 60, 120];

  private readonly feedback = inject(UiFeedbackService);
  private readonly translate = inject(TranslateService);
  private readonly profileStore = inject(BusinessProfileStore);

  private savedSnapshot: BusinessProfile = structuredClone(DEFAULT_BUSINESS_PROFILE);

  activeModal = signal<ProfileModal>(null);
  activeWebhookId = signal<string | null>(null);

  connectionDraft = { accountId: '', rateSchedule: '', connected: true };
  selectedBackupProvider = '';
  syncIntervalDraft: SyncInterval = 15;
  webhookDraft = { url: '', enabled: true };

  businessName = '';
  tin = '';
  address = '';
  apiKey = signal('');
  syncInterval = signal<SyncInterval>(15);
  apiUsagePercent = signal(0);
  provider = signal<ProviderState>({
    nameKey: 'businessProfile.samples.providerName',
    accountId: '',
    rateSchedule: '',
    connected: false,
    backupProvider: null,
  });
  documents = signal<TaxDocument[]>([]);
  webhooks = signal<WebhookItem[]>([]);
  upgradeRequested = signal(false);

  ngOnInit(): void {
    this.profileStore.load().subscribe(profile => {
      this.savedSnapshot = structuredClone(profile);
      this.applySnapshot(profile);
    });
  }

  readonly activeWebhook = computed(() => {
    const id = this.activeWebhookId();
    if (!id) return null;
    return this.webhooks().find(hook => hook.id === id) ?? null;
  });

  readonly isDirty = computed(() => JSON.stringify(this.currentSnapshot()) !== JSON.stringify(this.savedSnapshot));

  readonly donutBackground = computed(() => {
    const used = this.apiUsagePercent();
    return `conic-gradient(#1A3EB7 0% ${used}%, #E5E7EB ${used}% 100%)`;
  });

  readonly apiUsageAmountParams = computed(() => {
    const quota = this.upgradeRequested() ? '10M' : '5M';
    const used = Math.round((this.apiUsagePercent() / 100) * (this.upgradeRequested() ? 10 : 5) * 10) / 10;
    return { used: `${used}M`, total: quota };
  });

  documentDisplayName(document: TaxDocument): string {
    if (document.nameKey) {
      return this.translate.instant(document.nameKey);
    }
    return document.name ?? '';
  }

  formatUploadedLabel(document: TaxDocument): string {
    const locale = this.translate.currentLang === 'es' ? 'es-ES' : 'en-US';
    const date = new Date(document.uploadedAt).toLocaleDateString(locale, {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
    return this.translate.instant('businessProfile.uploadedOn', { date });
  }

  providerStatusClass(): string {
    return this.provider().connected ? 'badge-connected' : 'badge-disconnected';
  }

  providerStatusKey(): string {
    return this.provider().connected ? 'businessProfile.connected' : 'businessProfile.disconnected';
  }

  documentStatusKey(status: DocumentStatus): string {
    return status === 'verified' ? 'businessProfile.verified' : 'businessProfile.pendingReview';
  }

  hookStatusLabel(hook: WebhookItem): string {
    if (!hook.enabled) return 'businessProfile.hookDisabled';
    return hook.connected ? 'hooks.connected' : 'businessProfile.hookDisconnected';
  }

  openConnectionModal(): void {
    const current = this.provider();
    this.connectionDraft = {
      accountId: current.accountId,
      rateSchedule: current.rateSchedule,
      connected: current.connected,
    };
    this.activeModal.set('connection');
  }

  openBackupModal(): void {
    this.selectedBackupProvider = this.provider().backupProvider ?? this.backupProviderOptions[0];
    this.activeModal.set('backup');
  }

  openSyncModal(): void {
    this.syncIntervalDraft = this.syncInterval();
    this.activeModal.set('sync');
  }

  openWebhookModal(hookId: string): void {
    const hook = this.webhooks().find(item => item.id === hookId);
    if (!hook) return;
    this.activeWebhookId.set(hookId);
    this.webhookDraft = { url: hook.url, enabled: hook.enabled };
    this.activeModal.set('webhook');
  }

  openUpgradeModal(): void {
    this.activeModal.set('upgrade');
  }

  closeModal(): void {
    this.activeModal.set(null);
    this.activeWebhookId.set(null);
  }

  saveConnection(): void {
    this.provider.update(current => ({
      ...current,
      accountId: this.connectionDraft.accountId.trim() || current.accountId,
      rateSchedule: this.connectionDraft.rateSchedule.trim() || current.rateSchedule,
      connected: this.connectionDraft.connected,
    }));
    this.closeModal();
    this.feedback.showToast(this.translate.instant('businessProfile.toast.connectionUpdated'), 'success');
  }

  saveBackupProvider(): void {
    if (!this.selectedBackupProvider) return;
    this.provider.update(current => ({ ...current, backupProvider: this.selectedBackupProvider }));
    this.closeModal();
    this.feedback.showToast(
      this.translate.instant('businessProfile.toast.backupConnected', {
        provider: this.translate.instant(this.selectedBackupProvider),
      }),
      'success',
    );
  }

  saveSyncInterval(): void {
    this.syncInterval.set(this.syncIntervalDraft);
    this.closeModal();
    this.feedback.showToast(
      this.translate.instant('businessProfile.toast.syncIntervalSet', { minutes: this.syncIntervalDraft }),
      'success',
    );
  }

  saveWebhook(): void {
    const hookId = this.activeWebhookId();
    if (!hookId || !this.webhookDraft.url.trim()) return;

    this.webhooks.update(items =>
      items.map(item =>
        item.id === hookId
          ? {
              ...item,
              url: this.webhookDraft.url.trim(),
              enabled: this.webhookDraft.enabled,
              connected: this.webhookDraft.enabled,
            }
          : item,
      ),
    );
    this.closeModal();
    this.feedback.showToast(this.translate.instant('businessProfile.toast.webhookSaved'), 'success');
  }

  testWebhook(): void {
    const hook = this.activeWebhook();
    if (!hook || !this.webhookDraft.url.trim()) return;
    this.feedback.showToast(
      this.translate.instant('businessProfile.toast.webhookTested', { name: this.translate.instant(hook.labelKey) }),
      'info',
    );
  }

  submitUpgrade(): void {
    this.upgradeRequested.set(true);
    this.apiUsagePercent.set(42);
    this.closeModal();
    this.feedback.showToast(this.translate.instant('businessProfile.toast.upgradeSubmitted'), 'success');
  }

  downloadDocument(document: TaxDocument): void {
    const displayName = this.documentDisplayName(document);
    const lines = [
      displayName,
      `Status: ${document.status}`,
      this.formatUploadedLabel(document),
      '',
      'DomotiCore Business Profile Export',
      `Business: ${this.businessName}`,
      `Generated: ${new Date().toISOString()}`,
    ];
    const safeName = displayName.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase();
    downloadTextFile(`${safeName || 'document'}.txt`, lines.join('\n'));
    this.feedback.showToast(this.translate.instant('businessProfile.toast.downloading', { name: displayName }), 'success');
  }

  uploadDocumentation(): void {
    this.docInput?.nativeElement.click();
  }

  onDocumentSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.documents.update(items => [
      {
        id: `doc-${Date.now()}`,
        name: file.name,
        status: 'pending',
        uploadedAt: new Date().toISOString(),
      },
      ...items,
    ]);

    this.feedback.showToast(this.translate.instant('businessProfile.toast.fileUploadedTax', { name: file.name }), 'success');
    (event.target as HTMLInputElement).value = '';
  }

  generateNewKey(): void {
    const suffix = Math.random().toString(36).slice(2, 10);
    this.apiKey.set(`dc_live_${suffix}_regenerated`);
    this.feedback.showToast(this.translate.instant('businessProfile.toast.keyGenerated'), 'success');
  }

  copyApiKey(): void {
    const key = this.apiKey();
    if (!navigator.clipboard) {
      this.feedback.showToast(this.translate.instant('businessProfile.toast.keyCopied'), 'info');
      return;
    }

    void navigator.clipboard.writeText(key).then(() => {
      this.feedback.showToast(this.translate.instant('businessProfile.toast.keyCopied'), 'success');
    });
  }

  discardChanges(): void {
    if (!this.isDirty()) return;
    this.applySnapshot(this.savedSnapshot);
    this.feedback.showToast(this.translate.instant('businessProfile.toast.changesDiscarded'), 'warning');
  }

  saveConfiguration(): void {
    if (!this.isDirty()) return;

    const snapshot = this.currentSnapshot();
    this.profileStore.save(snapshot).subscribe(saved => {
      this.savedSnapshot = structuredClone(saved);
      this.applySnapshot(saved);
      this.feedback.showToast(this.translate.instant('businessProfile.toast.configSaved'), 'success');
    });
  }

  private currentSnapshot(): BusinessProfile {
    return {
      businessName: this.businessName,
      tin: this.tin,
      address: this.address,
      apiKey: this.apiKey(),
      syncInterval: this.syncInterval(),
      apiUsagePercent: this.apiUsagePercent(),
      provider: structuredClone(this.provider()),
      documents: structuredClone(this.documents()),
      webhooks: structuredClone(this.webhooks()),
      upgradeRequested: this.upgradeRequested(),
    };
  }

  private applySnapshot(snapshot: BusinessProfile): void {
    this.businessName = snapshot.businessName;
    this.tin = snapshot.tin;
    this.address = snapshot.address;
    this.apiKey.set(snapshot.apiKey);
    this.syncInterval.set(snapshot.syncInterval);
    this.apiUsagePercent.set(snapshot.apiUsagePercent);
    this.provider.set(structuredClone(snapshot.provider));
    this.documents.set(structuredClone(snapshot.documents));
    this.webhooks.set(structuredClone(snapshot.webhooks));
    this.upgradeRequested.set(snapshot.upgradeRequested);
  }
}
