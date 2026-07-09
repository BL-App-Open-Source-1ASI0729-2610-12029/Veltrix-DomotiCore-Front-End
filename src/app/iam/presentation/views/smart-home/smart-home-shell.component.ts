import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { AppOverlayComponent } from '../../../../shared/components/app-overlay/app-overlay.component';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { SmartHomeSidebarComponent } from './components/smart-home-sidebar.component';

@Component({
  selector: 'app-smart-home-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    AppOverlayComponent,
    NavbarComponent,
    SmartHomeSidebarComponent,
  ],
  template: `
    <div
      class="account-view account-view--home"
      [class.account-view--sidebar-open]="sidebarOpen"
      [class.account-view--settings]="isSettingsRoute()"
    >
      <app-overlay></app-overlay>
      <app-navbar
        [sidebarOpen]="sidebarOpen"
        (toggleSidebar)="toggleSidebar.emit()"
      ></app-navbar>

      <div
        class="account-view__backdrop"
        *ngIf="sidebarOpen"
        (click)="closeSidebar.emit()"
        aria-hidden="true"
      ></div>

      <div class="account-view__body">
        <app-smart-home-sidebar [isOpen]="sidebarOpen" (closeSidebar)="closeSidebar.emit()"></app-smart-home-sidebar>
        <main class="account-view__main">
          <div class="account-view__hero" *ngIf="!isSettingsRoute()">
            <span class="account-view__hero-badge">{{ 'views.smartHome.heroBadge' | translate }}</span>
            <p>{{ 'views.smartHome.heroText' | translate }}</p>
          </div>
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styleUrls: ['./smart-home-shell.component.css'],
})
export class SmartHomeShellComponent {
  @Input() sidebarOpen = true;
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() closeSidebar = new EventEmitter<void>();

  private readonly router = inject(Router);

  readonly isSettingsRoute = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.isSettingsUrl(this.router.url)),
      startWith(this.isSettingsUrl(this.router.url)),
    ),
    { initialValue: this.isSettingsUrl(this.router.url) },
  );

  private isSettingsUrl(url: string): boolean {
    return url.includes('/settings');
  }
}
