import { Routes } from '@angular/router';
import { AppShellComponent } from './layout/app-shell/app-shell';
import { DashboardPlaceholderComponent } from './features/dashboard/dashboard-placeholder/dashboard-placeholder';
import { OrganizationsPlaceholderComponent } from './features/organizations/organizations-placeholder/organizations-placeholder';
import { OrganizationDetailComponent } from './features/organizations/organization-detail/organization-detail';
import { OrganizationFormComponent } from './features/organizations/organization-form/organization-form';
import { UsersPlaceholderComponent } from './features/users/users-placeholder/users-placeholder';
import { RolesPlaceholderComponent } from './features/roles/roles-placeholder/roles-placeholder';
import { DocumentsPlaceholderComponent } from './features/documents/documents-placeholder/documents-placeholder';
import { SchedulePlaceholderComponent } from './features/schedule/schedule-placeholder/schedule-placeholder';
import { AuditPlaceholderComponent } from './features/audit/audit-placeholder/audit-placeholder';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: 'dashboard', component: DashboardPlaceholderComponent },
      { path: 'organizations', component: OrganizationsPlaceholderComponent },
      { path: 'organizations/new', component: OrganizationFormComponent },
      { path: 'organizations/:id', component: OrganizationDetailComponent },
      { path: 'users', component: UsersPlaceholderComponent },
      { path: 'roles', component: RolesPlaceholderComponent },
      { path: 'documents', component: DocumentsPlaceholderComponent },
      { path: 'schedule', component: SchedulePlaceholderComponent },
      { path: 'audit', component: AuditPlaceholderComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
