import { Routes } from '@angular/router';

export const historyRoutes: Routes = [
  {
    path: '',
    redirectTo: 'notifications',
    pathMatch: 'full',
  },
  {
    path: 'notifications',
    loadComponent: () =>
      import('./pages/notifications-center/notifications-center.component').then(
        m => m.NotificationsCenterComponent,
      ),
  },
  {
    path: 'activity',
    loadComponent: () =>
      import('./pages/history-log/history-log.component').then(m => m.HistoryLogComponent),
  },
  {
    path: 'energy',
    loadComponent: () =>
      import('./pages/energy-intelligence/energy-intelligence.component').then(
        m => m.EnergyIntelligenceComponent,
      ),
  },
];
