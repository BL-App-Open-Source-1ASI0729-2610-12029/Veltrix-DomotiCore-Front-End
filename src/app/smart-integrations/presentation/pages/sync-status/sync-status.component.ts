import { Component, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { GOOGLE_ICONS } from '../../../../shared/constants/google-icons';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

@Component({
  selector: 'app-sync-status',
  standalone: true,
  imports: [TranslateModule, ...MATERIAL_IMPORTS],
  template: `
    <div class="energy">
      <h1>{{ 'pages.syncStatus' | translate }}</h1>
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
        <div class="chart-placeholder">
          <p class="chart-placeholder-line">
            <img [src]="icons.barChart" alt="" class="ui-icon" />
            {{ 'syncStatus.chartPlaceholderLine1' | translate }}
          </p>
          <p>{{ 'syncStatus.chartPlaceholderLine2' | translate }}</p>
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
    .stat-change.positive {
      color: #16a34a;
    }
    .stat-change.negative {
      color: #dc2626;
    }
    .energy-chart {
      background: var(--white);
      border-radius: 20px;
      padding: 1.75rem;
      border: 1px solid var(--gray-200);
      box-shadow: var(--shadow-sm);
    }
    .energy-chart h2 {
      color: var(--gray-900);
      margin-bottom: 1.25rem;
      font-size: 1.5rem;
      font-weight: 600;
    }
    .chart-placeholder {
      text-align: center;
      color: var(--gray-600);
      padding: 2.5rem;
      border: 2px dashed var(--gray-200);
      border-radius: 16px;
      background: var(--gray-100);
    }
    .chart-placeholder p {
      margin: 0.5rem 0;
      font-size: 1rem;
    }
    .chart-placeholder-line {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 640px) {
      .energy {
        padding: 0;
      }

      .energy h1 {
        font-size: clamp(1.45rem, 5vw, 2.5rem);
        text-align: left;
      }

      .energy-stats {
        grid-template-columns: 1fr;
      }

      .stat-value {
        font-size: 2rem;
      }

      .chart-placeholder {
        padding: 1.5rem 1rem;
      }
    }
  `]
})
export class SyncStatusComponent {
  readonly icons = GOOGLE_ICONS;

  lastSync = signal(24.7);
  pendingSync = signal(18);
  reliability = signal(98.5);
}