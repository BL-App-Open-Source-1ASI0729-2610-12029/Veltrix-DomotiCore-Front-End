import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { GOOGLE_ICONS } from '../../../../shared/constants/google-icons';
import { IntegrationsApiService } from '../../../infrastructure/integrations-api.service';
import { BusinessProfileStore } from '../../../application/business-profile.store';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

interface SyncActivityPoint {
  labelKey: string;
  value: number;
}

@Component({
  selector: 'app-sync-status',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, ...MATERIAL_IMPORTS],
  template: `
    <div class="energy">
      <div class="energy-header">
        <h1>{{ 'pages.syncStatus' | translate }}</h1>
        <a mat-stroked-button routerLink="/app/smart-integrations/schedules">{{ 'integrations.schedules.title' | translate }}</a>
      </div>
      <div class="energy-stats">
        <div class="stat-card">
          <h3>{{ 'syncStatus.lastSync' | translate }}</h3>
          <p class="stat-value">{{ lastSync() }} {{ 'syncStatus.mins' | translate }}</p>
          <p class="stat-change positive">{{ 'syncStatus.changePositive' | translate }}</p>
        </div>
        <div class="stat-card">
          <h3>{{ 'syncStatus.pendingSync' | translate }}</h3>
          <p class="stat-value">{{ pendingSync() }} {{ 'syncStatus.items' | translate }}</p>
          <p class="stat-change negative">{{ 'syncStatus.changeNegative' | translate }}</p>
        </div>
        <div class="stat-card">
          <h3>{{ 'syncStatus.reliability' | translate }}</h3>
          <p class="stat-value">{{ reliability() }}%</p>
          <p class="stat-change positive">{{ 'syncStatus.changeStable' | translate }}</p>
        </div>
      </div>
      <div class="energy-chart">
        <h2>{{ 'pages.syncActivity' | translate }}</h2>
        <p class="chart-caption">{{ 'syncStatus.chartCaption' | translate }}</p>
        <div class="sync-chart">
          <div class="sync-chart__bar" *ngFor="let point of activityPoints()">
            <div
              class="sync-chart__fill"
              [style.height.%]="(point.value / maxActivityValue()) * 100"
              [class.sync-chart__fill--peak]="point.value === maxActivityValue()"
            ></div>
            <span>{{ point.labelKey | translate }}</span>
          </div>
        </div>
        <div class="chart-legend">
          <span class="legend-item">
            <span class="legend-dot"></span>
            {{ 'syncStatus.legend' | translate }}
          </span>
          <span class="legend-stat">{{ 'syncStatus.peakHour' | translate }}: {{ peakHourLabel() | translate }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .energy {
      padding: 2rem;
      animation: fadeIn 0.6s ease-in;
    }
    .energy h1 {
      color: var(--gray-900);
      margin-bottom: 1.75rem;
      font-size: 2.5rem;
      font-weight: 700;
      text-align: center;
    }
    .energy-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2.5rem;
    }
    .stat-card {
      background: var(--white);
      border: 1px solid var(--gray-200);
      border-radius: 20px;
      padding: 1.75rem;
      text-align: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      box-shadow: var(--shadow-sm);
    }
    .stat-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-md);
    }
    .stat-card h3 {
      color: var(--gray-900);
      margin-bottom: 1rem;
      font-size: 1.1rem;
    }
    .stat-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--primary-color);
      margin: 0.5rem 0;
    }
    .stat-change {
      font-size: 0.95rem;
      margin: 0;
      font-weight: 600;
    }
    .stat-change.positive { color: #16a34a; }
    .stat-change.negative { color: #dc2626; }
    .energy-chart {
      background: var(--white);
      border-radius: 20px;
      padding: 1.75rem;
      border: 1px solid var(--gray-200);
      box-shadow: var(--shadow-sm);
    }
    .energy-chart h2 {
      color: var(--gray-900);
      margin-bottom: 0.35rem;
      font-size: 1.5rem;
      font-weight: 600;
    }
    .chart-caption {
      margin: 0 0 1.25rem;
      color: var(--gray-600);
      font-size: 0.92rem;
    }
    .sync-chart {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 0.5rem;
      height: 180px;
      padding: 0.5rem 0.25rem 0;
    }
    .sync-chart__bar {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.45rem;
      height: 100%;
      justify-content: flex-end;
    }
    .sync-chart__fill {
      width: 100%;
      max-width: 36px;
      background: #c7d4f7;
      border-radius: 8px 8px 2px 2px;
      min-height: 10px;
      transition: height 0.35s ease;
    }
    .sync-chart__fill--peak {
      background: linear-gradient(180deg, #2949c7 0%, #5b74db 100%);
    }
    .sync-chart__bar span {
      font-size: 0.72rem;
      color: var(--gray-600);
      text-align: center;
    }
    .chart-legend {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-top: 1rem;
      flex-wrap: wrap;
      font-size: 0.88rem;
      color: var(--gray-600);
    }
    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
    }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #2949c7;
    }
    .legend-stat {
      font-weight: 600;
      color: var(--gray-800);
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 640px) {
      .energy { padding: 0; }
      .energy h1 {
        font-size: clamp(1.45rem, 5vw, 2.5rem);
        text-align: left;
      }
      .energy-stats { grid-template-columns: 1fr; }
      .stat-value { font-size: 2rem; }
      .sync-chart { height: 150px; }
    }
  `]
})
export class SyncStatusComponent implements OnInit {
  readonly icons = GOOGLE_ICONS;

  private readonly integrationsApi = inject(IntegrationsApiService);
  private readonly profileStore = inject(BusinessProfileStore);

  lastSync = signal(24.7);
  pendingSync = signal(18);
  reliability = signal(98.5);

  private readonly activityData = signal<SyncActivityPoint[]>([
    { labelKey: 'syncStatus.hours.6am', value: 12 },
    { labelKey: 'syncStatus.hours.9am', value: 28 },
    { labelKey: 'syncStatus.hours.12pm', value: 41 },
    { labelKey: 'syncStatus.hours.3pm', value: 36 },
    { labelKey: 'syncStatus.hours.6pm', value: 52 },
    { labelKey: 'syncStatus.hours.9pm', value: 31 },
    { labelKey: 'syncStatus.hours.12am', value: 14 },
  ]);

  ngOnInit(): void {
    this.profileStore.load().subscribe(profile => {
      this.lastSync.set(profile.syncInterval);
    });

    this.integrationsApi.getIntegrations().subscribe(data => {
      const integrations = data.connectedIntegrations ?? [];
      const schedules = data.schedules ?? [];
      const total = integrations.length || 1;
      const online = integrations.filter(item => item.status === 'online').length;
      const disconnected = integrations.filter(item => !item.connected).length;

      this.reliability.set(Math.round((online / total) * 1000) / 10);
      this.pendingSync.set(Math.max(disconnected * 6, schedules.filter(item => item.enabled).length));
    });
  }

  readonly activityPoints = computed(() => this.activityData());

  readonly maxActivityValue = computed(() =>
    Math.max(...this.activityData().map(point => point.value), 1),
  );

  readonly peakHourLabel = computed(() => {
    const peak = this.activityData().reduce((best, point) => (point.value > best.value ? point : best));
    return peak.labelKey;
  });
}
