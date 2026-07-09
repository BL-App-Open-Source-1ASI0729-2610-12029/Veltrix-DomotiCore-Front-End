import { Component, DestroyRef, HostListener, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../application/auth.service';
import { ThemeService } from '../../../shared/services/theme.service';
import { SettingsStore } from '../../../settings/application/settings.store';
import { TeamInvitationService } from '../../../team-management/application/team-invitation.service';
import { TeamMembershipService } from '../../../team-management/application/team-membership.service';
import { SmartHomeShellComponent } from './smart-home/smart-home-shell.component';
import { SmallBusinessShellComponent } from './small-business/small-business-shell.component';

@Component({
  selector: 'app-account-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, SmartHomeShellComponent, SmallBusinessShellComponent],
  template: `
    @if (auth.getEffectiveAccountType() === 'small-business') {
      <app-small-business-shell
        [sidebarOpen]="sidebarOpen"
        (toggleSidebar)="onToggleSidebar()"
        (closeSidebar)="onCloseSidebar()"
      />
    } @else {
      <app-smart-home-shell
        [sidebarOpen]="sidebarOpen"
        (toggleSidebar)="onToggleSidebar()"
        (closeSidebar)="onCloseSidebar()"
      />
    }
  `,
})
export class AccountShellComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly theme = inject(ThemeService);
  private readonly settingsStore = inject(SettingsStore);
  private readonly teamInvitations = inject(TeamInvitationService);
  private readonly teamMembership = inject(TeamMembershipService);

  sidebarOpen = true;

  constructor() {
    this.initializeTranslations();
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.theme.init();
      this.settingsStore.fetchSettings();
      this.teamMembership.sync();
      this.teamInvitations.startPolling(this.auth.currentUser);
      this.sidebarOpen = window.innerWidth >= 1025;
      this.router.events
        .pipe(
          filter((event): event is NavigationEnd => event instanceof NavigationEnd),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => this.reapplyTheme());
    }
  }

  ngOnDestroy(): void {
    this.teamInvitations.stopPolling();
  }

  onToggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  onCloseSidebar(): void {
    this.sidebarOpen = false;
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (isPlatformBrowser(this.platformId) && window.innerWidth < 1025) {
      this.sidebarOpen = false;
    }
  }

  private reapplyTheme(): void {
    const mode = this.theme.getCurrent();
    if (mode) {
      this.theme.apply(mode);
    }
  }

  private initializeTranslations(): void {
    const browserLang = this.translate.getBrowserLang() || 'es';
    const supportedLanguages = ['en', 'es'];
    const currentLanguage = supportedLanguages.includes(browserLang) ? browserLang : 'es';

    this.translate.setDefaultLang('es');
    this.translate.use(currentLanguage);
  }
}

