import { Component, HostListener, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../application/auth.service';
import { ThemeService } from '../../../shared/services/theme.service';
import { SettingsStore } from '../../../settings/application/settings.store';
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
export class AccountShellComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly theme = inject(ThemeService);
  private readonly settingsStore = inject(SettingsStore);

  sidebarOpen = true;

  constructor() {
    this.initializeTranslations();
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.theme.init();
      this.settingsStore.fetchSettings();
      this.sidebarOpen = window.innerWidth >= 1025;
    }
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

  private initializeTranslations(): void {
    const browserLang = this.translate.getBrowserLang() || 'es';
    const supportedLanguages = ['en', 'es'];
    const currentLanguage = supportedLanguages.includes(browserLang) ? browserLang : 'es';

    this.translate.setDefaultLang('es');
    this.translate.use(currentLanguage);
  }
}

