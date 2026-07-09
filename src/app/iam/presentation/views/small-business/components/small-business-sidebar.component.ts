import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../application/auth.service';
import { RolePermissionService } from '../../../../application/role-permission.service';
import { SMALL_BUSINESS_NAV_ITEMS } from '../../../../domain/model/account-navigation.entity';
import { GOOGLE_ICONS } from '../../../../../shared/constants/google-icons';
import { UiFeedbackService } from '../../../../../shared/services/ui-feedback.service';
import { MATERIAL_IMPORTS } from '../../../../../shared/material';

@Component({
  selector: 'app-small-business-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule, ...MATERIAL_IMPORTS],
  template: `
    <aside class="view-sidebar view-sidebar--business" [class.view-sidebar--open]="isOpen">
      <div class="view-sidebar__content">
        <div class="view-sidebar__header">
          <div class="brand">
            <img src="assets/icons/shared/image.png" [alt]="'navbar.logoAlt' | translate" class="brand__logo brand__logo--business" />
            <div>
              <h1 class="brand__name">{{ 'app.title' | translate }}</h1>
              <p class="brand__tagline">{{ 'views.smallBusiness.tagline' | translate }}</p>
            </div>
          </div>
          <mat-chip-set>
            <mat-chip>{{ 'views.smallBusiness.badge' | translate }}</mat-chip>
          </mat-chip-set>
        </div>

        <mat-nav-list class="view-sidebar__nav">
          <div mat-subheader>{{ 'views.smallBusiness.section' | translate }}</div>
          @for (item of visibleNavItems(); track item.route) {
            <a mat-list-item [routerLink]="item.route" routerLinkActive="active" (click)="closeSidebar.emit()">
              <img matListItemIcon [src]="item.icon" alt="" class="ui-icon ui-icon--sm" />
              <span matListItemTitle>{{ item.labelKey | translate }}</span>
            </a>
          }
        </mat-nav-list>

        <div class="view-sidebar__footer">
          <button mat-flat-button color="primary" type="button" class="add-device-btn full-width" (click)="onAddDevice()" *ngIf="permissions.canDeleteDevices()">
            <mat-icon>add</mat-icon>
            {{ 'views.smallBusiness.addDevice' | translate }}
          </button>
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
  styleUrls: ['../../view-sidebar.shared.css', './small-business-sidebar.component.css'],
})
export class SmallBusinessSidebarComponent {
  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();

  readonly permissions = inject(RolePermissionService);

  readonly visibleNavItems = computed(() =>
    SMALL_BUSINESS_NAV_ITEMS.filter(item => {
      if (item.route === '/app/users') {
        return this.permissions.canManageTeam();
      }
      if (item.route === '/app/smart-integrations') {
        return this.permissions.canManageIntegrations();
      }
      return true;
    }),
  );
  readonly icons = GOOGLE_ICONS;

  private readonly auth = inject(AuthService);
  private readonly feedback = inject(UiFeedbackService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  onSignOut(): void {
    this.auth.logout();
  }

  onHelp(): void {
    this.feedback.openHelp('integrations');
    this.closeSidebar.emit();
  }

  onAddDevice(): void {
    this.router.navigate(['/app/devices/explorer'], { queryParams: { add: '1' } });
    this.closeSidebar.emit();
  }
}
