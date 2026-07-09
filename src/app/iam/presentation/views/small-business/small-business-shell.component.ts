import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppOverlayComponent } from '../../../../shared/components/app-overlay/app-overlay.component';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { SmallBusinessSidebarComponent } from './components/small-business-sidebar.component';

@Component({
  selector: 'app-small-business-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    AppOverlayComponent,
    NavbarComponent,
    SmallBusinessSidebarComponent,
  ],
  template: `
    <div class="account-view account-view--business" [class.account-view--sidebar-open]="sidebarOpen">
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
        <app-small-business-sidebar [isOpen]="sidebarOpen" (closeSidebar)="closeSidebar.emit()"></app-small-business-sidebar>
        <main class="account-view__main">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styleUrls: ['./small-business-shell.component.css'],
})
export class SmallBusinessShellComponent {
  @Input() sidebarOpen = true;
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() closeSidebar = new EventEmitter<void>();
}
