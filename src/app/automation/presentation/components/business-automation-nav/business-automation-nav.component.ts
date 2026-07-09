import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

@Component({
  selector: 'app-business-automation-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule, ...MATERIAL_IMPORTS],
  template: `
    <nav class="biz-auto-nav" [attr.aria-label]="'common.a11y.businessAutomationSections' | translate">
      <a
        mat-button
        routerLink="/app/automation/center"
        routerLinkActive="biz-auto-nav__link--active"
        [routerLinkActiveOptions]="{ exact: false }"
        class="biz-auto-nav__link"
      >
        {{ 'automation.navBusinessCenter' | translate }}
      </a>
      <a
        mat-button
        routerLink="/app/automation/zones"
        routerLinkActive="biz-auto-nav__link--active"
        class="biz-auto-nav__link"
      >
        {{ 'zoneConfiguration.nav' | translate }}
      </a>
    </nav>
  `,
  styles: [`
    .biz-auto-nav {
      display: inline-flex;
      gap: 0.35rem;
      background: var(--surface-soft, #eef1f7);
      border-radius: 999px;
      padding: 0.25rem;
      margin-bottom: 1.25rem;
    }

    .biz-auto-nav__link {
      text-decoration: none;
      border-radius: 999px;
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--gray-500, #6b7a94);
      transition: background 0.2s ease, color 0.2s ease;
    }

    .biz-auto-nav__link--active {
      background: var(--surface, #fff);
      color: var(--primary-color, #1a3b8b);
      box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.08));
    }
  `],
})
export class BusinessAutomationNavComponent {}
