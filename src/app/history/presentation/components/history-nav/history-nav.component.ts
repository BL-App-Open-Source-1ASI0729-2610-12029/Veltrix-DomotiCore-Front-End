import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

@Component({
  selector: 'app-history-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule, ...MATERIAL_IMPORTS],
  template: `
    <nav class="history-nav" [attr.aria-label]="'common.a11y.historySections' | translate">
      <a mat-button routerLink="/app/history/notifications" routerLinkActive="history-nav__link--active" class="history-nav__link">
        {{ 'historyNotifications.nav' | translate }}
      </a>
      <a mat-button routerLink="/app/history/activity" routerLinkActive="history-nav__link--active" class="history-nav__link">
        {{ 'historyLog.navActivity' | translate }}
      </a>
      <a mat-button routerLink="/app/history/energy" routerLinkActive="history-nav__link--active" class="history-nav__link">
        {{ 'history.navEnergy' | translate }}
      </a>
    </nav>
  `,
  styles: [`
    .history-nav {
      display: inline-flex;
      gap: 0.35rem;
      background: var(--surface-soft);
      border-radius: 999px;
      padding: 0.25rem;
      margin-bottom: 1.25rem;
    }

    .history-nav__link {
      text-decoration: none;
      border-radius: 999px;
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--gray-500);
      transition: background 0.2s ease, color 0.2s ease;
    }

    .history-nav__link--active {
      background: var(--surface);
      color: var(--primary-color);
      box-shadow: var(--shadow-sm);
    }
  `],
})
export class HistoryNavComponent {}
