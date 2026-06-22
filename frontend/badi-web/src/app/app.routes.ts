import { Routes } from '@angular/router';
import { AppShellComponent } from './layout/app-shell/app-shell';

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
      {
        path: 'agreements',
        children: [
          { path: '', loadComponent: () => import('./features/agreements/agreements-list/agreements-list').then(m => m.AgreementsListComponent) },
          { path: 'types', loadComponent: () => import('./features/agreements/agreement-types-list/agreement-types-list').then(m => m.AgreementTypesListComponent) },
          { path: ':id', loadComponent: () => import('./features/agreements/agreement-detail/agreement-detail').then(m => m.AgreementDetailComponent) }
        ]
      },
      { path: 'users', loadComponent: () => import('./features/users/users-placeholder/users-placeholder').then(m => m.UsersPlaceholderComponent) },
      { path: 'roles', loadComponent: () => import('./features/roles/roles-placeholder/roles-placeholder').then(m => m.RolesPlaceholderComponent) },
      {
        path: 'documents',
        children: [
          { path: '', loadComponent: () => import('./features/documents/documents-list/documents-list').then(m => m.DocumentsListComponent) },
          { path: 'types', loadComponent: () => import('./features/documents/document-types-list/document-types-list').then(m => m.DocumentTypesListComponent) }
        ]
      },
      { path: 'schedule', loadComponent: () => import('./features/schedule/schedule-calendar/schedule-calendar').then(m => m.ScheduleCalendarComponent) },
      {
        path: 'realized-deliveries',
        children: [
          { path: '', loadComponent: () => import('./features/realized-deliveries/realized-deliveries-list/realized-deliveries-list').then(m => m.RealizedDeliveriesListComponent) },
          { path: 'new', loadComponent: () => import('./features/realized-deliveries/realized-delivery-form/realized-delivery-form').then(m => m.RealizedDeliveryFormComponent) },
          { path: ':id', loadComponent: () => import('./features/realized-deliveries/realized-delivery-detail/realized-delivery-detail').then(m => m.RealizedDeliveryDetailComponent) }
        ]
      },
      { path: 'audit', loadComponent: () => import('./features/audit/audit-placeholder/audit-placeholder').then(m => m.AuditPlaceholderComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
