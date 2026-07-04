import { Routes } from '@angular/router';
import { AppShellComponent } from './layout/app-shell/app-shell';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password').then(m => m.ResetPasswordComponent)
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
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
      { 
        path: 'users', 
        loadComponent: () => import('./features/users/users-list/users-list').then(m => m.UsersListComponent),
        canActivate: [roleGuard],
        data: { roles: ['Administrador'] }
      },
      { 
        path: 'roles', 
        loadComponent: () => import('./features/roles/roles-list/roles-list').then(m => m.RolesListComponent),
        canActivate: [roleGuard],
        data: { roles: ['Administrador'] }
      },
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
      { 
        path: 'audit', 
        loadComponent: () => import('./features/audit/audit-list/audit-list').then(m => m.AuditListComponent),
        canActivate: [roleGuard],
        data: { roles: ['Administrador', 'Auditor'] }
      },
      { path: 'profile', loadComponent: () => import('./features/profile/profile-detail/profile-detail').then(m => m.ProfileDetailComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
