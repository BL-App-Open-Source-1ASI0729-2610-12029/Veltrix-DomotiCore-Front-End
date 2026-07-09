import { Component, Output, EventEmitter, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../iam/application/auth.service';
import { RolePermissionService } from '../../../../iam/application/role-permission.service';
import { AccountType } from '../../../../iam/domain/model/account-type.entity';
import { TeamInvitationService } from '../../../../team-management/application/team-invitation.service';
import { SettingsStore } from '../../../../settings/application/settings.store';
import { GOOGLE_ICONS } from '../../../constants/google-icons';
import { GlobalSearchService } from '../../../services/global-search.service';
import { UiFeedbackService } from '../../../services/ui-feedback.service';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { MATERIAL_IMPORTS } from '../../../material';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, TranslateModule, LanguageSwitcherComponent, ...MATERIAL_IMPORTS],
  template: `
    <header class="navbar" [class.layout-sidebar-open]="sidebarOpen">
      <div class="navbar-start">
        <button mat-icon-button type="button" class="hamburger-btn" (click)="toggleSidebar.emit()" [attr.aria-label]="'navigation.menu' | translate">
          <mat-icon>menu</mat-icon>
        </button>

        @if (auth.canAccessBothSegments()) {
          <div class="segment-switcher" role="group" [attr.aria-label]="'navbar.segmentSwitcher' | translate">
            <button
              type="button"
              class="segment-switcher__btn"
              [class.segment-switcher__btn--active]="auth.getEffectiveAccountType() === 'smart-home'"
              (click)="switchSegment('smart-home')"
            >
              {{ 'navbar.segmentSmartHome' | translate }}
            </button>
            <button
              type="button"
              class="segment-switcher__btn"
              [class.segment-switcher__btn--active]="auth.getEffectiveAccountType() === 'small-business'"
              (click)="switchSegment('small-business')"
            >
              {{ 'navbar.segmentSmallBusiness' | translate }}
            </button>
          </div>
        }
      </div>

      <div class="navbar-center">
        <mat-form-field appearance="outline" class="navbar-search" subscriptSizing="dynamic">
          <mat-icon matPrefix class="search-icon">search</mat-icon>
          <input
            matInput
            type="search"
            [placeholder]="searchPlaceholder()"
            (keydown.enter)="onSearchSubmit($event)"
          />
        </mat-form-field>
      </div>

      <div class="navbar-end">
        <app-language-switcher></app-language-switcher>

        <button
          mat-icon-button
          type="button"
          class="btn-icon"
          [matBadge]="feedback.unreadCount() > 0 ? feedback.unreadCount() : null"
          matBadgeColor="warn"
          matBadgeSize="small"
          [matBadgeHidden]="feedback.unreadCount() === 0"
          [matTooltip]="'overlay.notifications' | translate"
          (click)="onNotifications()"
        >
          <mat-icon>notifications</mat-icon>
        </button>

        <button mat-icon-button type="button" class="btn-icon btn-icon--help" [matTooltip]="'overlay.helpCenter' | translate" (click)="onHelp()">
          <mat-icon>help_outline</mat-icon>
        </button>

        <div class="user-profile-small">
          <div class="user-info-small">
            <span class="user-name-small">{{ settingsStore.settings().fullName }}</span>
            <span class="user-role-small">{{ roleLabel() }}</span>
          </div>
          <button type="button" mat-button class="btn-profile btn-profile--photo" (click)="onProfile()">
            <img [src]="settingsStore.getProfilePhoto()" [alt]="settingsStore.settings().fullName" class="navbar-avatar" />
          </button>
        </div>
      </div>
    </header>
  `,
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();
  @Input() sidebarOpen = true;
  readonly icons = GOOGLE_ICONS;
  readonly settingsStore = inject(SettingsStore);
  readonly auth = inject(AuthService);
  readonly feedback = inject(UiFeedbackService);
  private readonly permissions = inject(RolePermissionService);
  private readonly teamInvitations = inject(TeamInvitationService);
  private readonly globalSearch = inject(GlobalSearchService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.settingsStore.fetchSettings();
      this.teamInvitations.startPolling(this.auth.currentUser);
    }
  }

  searchPlaceholder(): string {
    const key =
      this.auth.getEffectiveAccountType() === 'small-business'
        ? 'navbar.searchPlaceholderBusiness'
        : 'navbar.searchPlaceholder';
    return this.translate.instant(key);
  }

  roleLabel(): string {
    if (this.auth.getEffectiveAccountType() === 'small-business') {
      return this.translate.instant('navbar.facilityManager');
    }
    return this.translate.instant(this.permissions.roleLabelKey());
  }

  switchSegment(segment: AccountType): void {
    this.auth.switchSegment(segment);
  }

  onNotifications(): void {
    this.teamInvitations.syncForCurrentUser(this.auth.currentUser);
    this.feedback.toggleNotifications();
  }

  onHelp(): void {
    this.feedback.openHelp('general');
  }

  onProfile(): void {
    this.router.navigate(['/app/settings']);
  }

  onSearchSubmit(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (!value) return;

    const accountType = this.auth.getEffectiveAccountType() === 'small-business' ? 'small-business' : 'smart-home';
    const route = this.globalSearch.resolveRoute(value, accountType);
    if (!route.length) return;

    this.router.navigate(route, { queryParams: { q: value } });
    this.feedback.showToast(
      this.translate.instant('navbar.searchNavigating', { query: value }),
      'info',
    );
  }
}
