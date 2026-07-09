import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  IntegrationSchedule,
  IntegrationsApiService,
} from '../../../infrastructure/integrations-api.service';
import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

@Component({
  selector: 'app-integration-schedules',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, ...MATERIAL_IMPORTS],
  template: `
    <div class="schedules-page">
      <div class="schedules-header">
        <div>
          <a mat-button routerLink="/app/smart-integrations/sync-status">{{ 'pages.syncStatus' | translate }}</a>
          <h1>{{ 'integrations.schedules.title' | translate }}</h1>
          <p>{{ 'integrations.schedules.description' | translate }}</p>
        </div>
        <button mat-flat-button color="primary" (click)="openCreate()">{{ 'integrations.schedules.add' | translate }}</button>
      </div>

      <div class="schedules-grid" *ngIf="schedules().length; else emptyState">
        <mat-card class="schedule-card" *ngFor="let schedule of schedules()">
          <mat-card-content>
            <h3>{{ schedule.deviceName }}</h3>
            <p>{{ schedule.onTime }} – {{ schedule.offTime }}</p>
            <p class="schedule-meta">{{ schedule.integrationId }} · {{ schedule.timezone || 'UTC' }}</p>
            <mat-slide-toggle
              [checked]="schedule.enabled"
              (change)="toggleEnabled(schedule, $event.checked)"
            >
              {{ 'integrations.schedules.enabled' | translate }}
            </mat-slide-toggle>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button (click)="remove(schedule)">{{ 'buttons.delete' | translate }}</button>
          </mat-card-actions>
        </mat-card>
      </div>

      <ng-template #emptyState>
        <p class="empty-state">{{ 'integrations.schedules.empty' | translate }}</p>
      </ng-template>
    </div>

    <div class="modal-backdrop" *ngIf="showModal()" (click)="closeModal()">
      <div class="modal-panel" (click)="$event.stopPropagation()">
        <h3>{{ 'integrations.schedules.add' | translate }}</h3>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'integrations.schedules.deviceName' | translate }}</mat-label>
          <input matInput [(ngModel)]="draft.deviceName" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'integrations.schedules.integrationId' | translate }}</mat-label>
          <input matInput [(ngModel)]="draft.integrationId" />
        </mat-form-field>
        <div class="time-row">
          <mat-form-field appearance="outline">
            <mat-label>{{ 'integrations.schedules.onTime' | translate }}</mat-label>
            <input matInput [(ngModel)]="draft.onTime" placeholder="08:00" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>{{ 'integrations.schedules.offTime' | translate }}</mat-label>
            <input matInput [(ngModel)]="draft.offTime" placeholder="18:00" />
          </mat-form-field>
        </div>
        <div class="modal-actions">
          <button mat-stroked-button (click)="closeModal()">{{ 'buttons.cancel' | translate }}</button>
          <button mat-flat-button color="primary" (click)="saveNew()">{{ 'buttons.save' | translate }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .schedules-page { padding: 2rem; }
    .schedules-header { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
    .schedules-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
    .schedule-card h3 { margin: 0 0 0.5rem; }
    .schedule-meta { color: var(--gray-600); font-size: 0.9rem; }
    .empty-state { text-align: center; color: var(--gray-600); padding: 2rem; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: grid; place-items: center; z-index: 1000; }
    .modal-panel { background: var(--white); border-radius: 16px; padding: 1.5rem; width: min(480px, 92vw); }
    .full-width { width: 100%; }
    .time-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; }
  `],
})
export class IntegrationSchedulesComponent implements OnInit {
  private readonly api = inject(IntegrationsApiService);
  private readonly feedback = inject(UiFeedbackService);
  private readonly translate = inject(TranslateService);

  readonly schedules = signal<IntegrationSchedule[]>([]);
  readonly showModal = signal(false);
  draft = {
    deviceName: '',
    integrationId: 'lighting-hub',
    onTime: '08:00',
    offTime: '18:00',
    enabled: true,
    timezone: 'America/Lima',
  };

  ngOnInit(): void {
    this.load();
  }

  openCreate(): void {
    this.draft = {
      deviceName: '',
      integrationId: 'lighting-hub',
      onTime: '08:00',
      offTime: '18:00',
      enabled: true,
      timezone: 'America/Lima',
    };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveNew(): void {
    if (!this.draft.deviceName.trim()) return;

    this.api.createSchedule(this.draft).subscribe(() => {
      this.closeModal();
      this.load();
      this.feedback.showToast(this.translate.instant('integrations.schedules.saved'), 'success');
    });
  }

  toggleEnabled(schedule: IntegrationSchedule, enabled: boolean): void {
    this.api.updateSchedule(schedule.id, { enabled }).subscribe(() => {
      this.schedules.update(items =>
        items.map(item => (item.id === schedule.id ? { ...item, enabled } : item)),
      );
    });
  }

  remove(schedule: IntegrationSchedule): void {
    if (!this.feedback.confirmAction(this.translate.instant('common.confirm.delete'))) return;

    this.api.deleteSchedule(schedule.id).subscribe(() => {
      this.schedules.update(items => items.filter(item => item.id !== schedule.id));
      this.feedback.showToast(this.translate.instant('integrations.schedules.deleted'), 'success');
    });
  }

  private load(): void {
    this.api.getIntegrations().subscribe(data => {
      this.schedules.set(data.schedules ?? []);
    });
  }
}
