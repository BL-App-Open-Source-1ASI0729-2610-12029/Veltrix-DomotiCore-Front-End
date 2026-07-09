import { Routes } from '@angular/router';

/** Pequeños Negocios — reportes empresariales */
export const businessReportsRoutes: Routes = [
  {
    path: '',
    redirectTo: 'comparative',
    pathMatch: 'full',
  },
  {
    path: 'comparative',
    loadComponent: () =>
      import('./pages/business-reports/business-reports.component').then(
        m => m.BusinessReportsComponent,
      ),
  },
  {
    path: 'cost-analysis',
    loadComponent: () =>
      import('./pages/cost-analysis/cost-analysis.component').then(
        m => m.CostAnalysisComponent,
      ),
  },
  {
    path: 'alerts-history',
    loadComponent: () =>
      import('./pages/alerts-history/alerts-history.component').then(
        m => m.AlertsHistoryComponent,
      ),
  },
];
