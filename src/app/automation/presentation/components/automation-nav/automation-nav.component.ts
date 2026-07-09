import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

@Component({
  selector: 'app-automation-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule, ...MATERIAL_IMPORTS],
  template: `
    <nav class="automation-nav" [attr.aria-label]="'common.a11y.automationSections' | translate">
      <a mat-button routerLink="/app/automation/center" routerLinkActive="automation-nav__link--active" class="automation-nav__link">
        {{ 'automation.navCenter' | translate }}
      </a>
      <a mat-button routerLink="/app/automation/builder" routerLinkActive="automation-nav__link--active" class="automation-nav__link">
        {{ 'automationBuilder.nav' | translate }}
      </a>
    </nav>
  `,
  styles: [`
    .automation-nav {
      display: inline-flex;
      gap: 0.35rem;
      background: var(--surface-soft);
      border-radius: 999px;
      padding: 0.25rem;
      margin-bottom: 1.25rem;
    }

    .automation-nav__link {
      text-decoration: none;
      border-radius: 999px;
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--gray-500);
      transition: background 0.2s ease, color 0.2s ease;
    }

    .automation-nav__link--active {
      background: var(--surface);
      color: var(--primary-color);
      box-shadow: var(--shadow-sm);
    }
  `],
})
export class AutomationNavComponent {}
