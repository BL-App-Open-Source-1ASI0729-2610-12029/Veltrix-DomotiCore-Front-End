import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../../application/auth.service';
import { SecurityStore } from '../../../../../security/application/security.store';
import { SMART_HOME_NAV_ITEMS } from '../../../../domain/model/account-navigation.entity';
import { GOOGLE_ICONS } from '../../../../../shared/constants/google-icons';
import { UiFeedbackService } from '../../../../../shared/services/ui-feedback.service';
import { MATERIAL_IMPORTS } from '../../../../../shared/material';

@Component({
  selector: 'app-smart-home-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule, ...MATERIAL_IMPORTS],
  template: `
    <aside class="view-sidebar view-sidebar--home" [class.view-sidebar--open]="isOpen">
      <div class="view-sidebar__content">
        <div class="view-sidebar__header">
          <div class="brand">
            <img src="assets/icons/shared/image.png" [alt]="'navbar.logoAlt' | translate" class="brand__logo" />
            <div>
              <h1 class="brand__name">{{ 'app.title' | translate }}</h1>
              <p class="brand__tagline">{{ 'views.smartHome.tagline' | translate }}</p>
            </div>
          </div>
          <mat-chip-set>
            <mat-chip>{{ 'views.smartHome.badge' | translate }}</mat-chip>
          </mat-chip-set>
        </div>

        <mat-nav-list class="view-sidebar__nav">
          <div mat-subheader>{{ 'sidebar.sectionMain' | translate }}</div>
          @for (item of navItems; track item.route) {
            <a mat-list-item [routerLink]="item.route" routerLinkActive="active" (click)="closeSidebar.emit()">
              <img matListItemIcon [src]="item.icon" alt="" class="ui-icon ui-icon--sm" />
              <span matListItemTitle>{{ item.labelKey | translate }}</span>
            </a>
          }
        </mat-nav-list>

        <div class="view-sidebar__footer">
          <mat-card
            appearance="outlined"
            class="status-card"
            [class.status-card--home]="security.allLocksSecured()"
            [class.status-card--alert]="!security.allLocksSecured()"
          >
            <mat-card-content>
              <span class="status-card__label">{{ 'sidebar.securityStatus' | translate }}</span>
              <span class="status-card__value">
                <span class="status-dot"></span>
                {{
                  security.allLocksSecured()
                    ? ('sidebar.fullyProtected' | translate)
                    : ('security.partiallyProtected' | translate)
                }}
              </span>
            </mat-card-content>
          </mat-card>
          <button mat-stroked-button type="button" class="footer-btn full-width" (click)="onHelp()">
            <mat-icon>help_outline</mat-icon>
            {{ 'navigation.helpCenter' | translate }}
          </button>
          <button mat-stroked-button color="warn" type="button" class="footer-btn full-width" (click)="onSignOut()">
            <mat-icon>logout</mat-icon>
            {{ 'navigation.signOut' | translate }}
          </button>
        </div>
      </div>
    </aside>
  `,
  styleUrls: ['../../view-sidebar.shared.css', './smart-home-sidebar.component.css'],
})
export class SmartHomeSidebarComponent implements OnInit {
  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();

  readonly navItems = SMART_HOME_NAV_ITEMS;
  readonly icons = GOOGLE_ICONS;
  readonly security = inject(SecurityStore);

  private readonly auth = inject(AuthService);
  private readonly feedback = inject(UiFeedbackService);

  ngOnInit(): void {
    this.security.ensureLocksLoaded();
  }

  onSignOut(): void {
    this.auth.logout();
  }

  onHelp(): void {
    this.feedback.openHelp('dashboard');
    this.closeSidebar.emit();
  }
}
