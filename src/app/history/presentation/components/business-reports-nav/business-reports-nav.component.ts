import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

@Component({
  selector: 'app-business-reports-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule, ...MATERIAL_IMPORTS],
  template: `
    <nav class="biz-reports-nav" [attr.aria-label]="'common.a11y.businessReportsSections' | translate">
      <a
        mat-button
        routerLink="/app/reports/comparative"
        routerLinkActive="biz-reports-nav__link--active"
        class="biz-reports-nav__link"
      >
        {{ 'businessReports.navComparative' | translate }}
      </a>
      <a
        mat-button
        routerLink="/app/reports/cost-analysis"
        routerLinkActive="biz-reports-nav__link--active"
        class="biz-reports-nav__link"
      >
        {{ 'costAnalysis.nav' | translate }}
      </a>
      <a
        mat-button
        routerLink="/app/reports/alerts-history"
        routerLinkActive="biz-reports-nav__link--active"
        class="biz-reports-nav__link"
      >
        {{ 'alertsHistory.nav' | translate }}
      </a>
    </nav>
  `,
  styles: [`
    .biz-reports-nav {
      display: inline-flex;
      gap: 0.35rem;
      background: var(--surface-soft, #eef1f7);
      border-radius: 999px;
      padding: 0.25rem;
      margin-bottom: 1.25rem;
    }

    .biz-reports-nav__link {
      text-decoration: none;
      border-radius: 999px;
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--gray-500, #6b7a94);
      transition: background 0.25s ease, color 0.25s ease, transform 0.2s ease;
    }

    .biz-reports-nav__link:hover {
      color: var(--primary-color, #1a3b8b);
      transform: translateY(-1px);
    }

    .biz-reports-nav__link--active {
      background: var(--surface, #fff);
      color: var(--primary-color, #1a3b8b);
      box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.08));
      animation: navPillIn 0.3s cubic-bezier(0.22, 1, 0.36, 1);
    }

    @keyframes navPillIn {
      from { transform: scale(0.94); opacity: 0.7; }
      to { transform: scale(1); opacity: 1; }
    }
  `],
})
export class BusinessReportsNavComponent {}
