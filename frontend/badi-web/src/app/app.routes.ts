import { Routes } from '@angular/router';
import { AppShellComponent } from './layout/app-shell/app-shell';
import { AuditPlaceholderComponent } from './features/audit/audit-placeholder/audit-placeholder';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard-placeholder/dashboard-placeholder').then(m => m.DashboardPlaceholderComponent) },
      {
        path: 'organizations',
        children: [
          { path: '', loadComponent: () => import('./features/organizations/organizations-placeholder/organizations-placeholder').then(m => m.OrganizationsPlaceholderComponent) },
          { path: 'new', loadComponent: () => import('./features/organizations/organization-form/organization-form').then(m => m.OrganizationFormComponent) },
          { path: ':id/edit', loadComponent: () => import('./features/organizations/organization-form/organization-form').then(m => m.OrganizationFormComponent) },
          { path: ':id', loadComponent: () => import('./features/organizations/organization-detail/organization-detail').then(m => m.OrganizationDetailComponent) },
        ]
      },
      { path: 'agreements', loadComponent: () => import('./features/agreements/agreements-list/agreements-list').then(m => m.AgreementsListComponent) },
      { path: 'users', loadComponent: () => import('./features/users/users-placeholder/users-placeholder').then(m => m.UsersPlaceholderComponent) },
      { path: 'roles', loadComponent: () => import('./features/roles/roles-placeholder/roles-placeholder').then(m => m.RolesPlaceholderComponent) },
      { path: 'documents', loadComponent: () => import('./features/documents/documents-placeholder/documents-placeholder').then(m => m.DocumentsPlaceholderComponent) },
      { path: 'schedule', loadComponent: () => import('./features/schedule/schedule-placeholder/schedule-placeholder').then(m => m.SchedulePlaceholderComponent) },
      { path: 'audit', loadComponent: () => import('./features/audit/audit-placeholder/audit-placeholder').then(m => m.AuditPlaceholderComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
