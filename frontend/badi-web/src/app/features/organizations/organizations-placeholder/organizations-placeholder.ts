import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  OrganizationsService,
  OrganizationSummary
} from '../organizations.service';

@Component({
  selector: 'app-organizations-placeholder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './organizations-placeholder.html',
  styleUrl: './organizations-placeholder.scss'
})
export class OrganizationsPlaceholderComponent implements OnInit {

  organizations: OrganizationSummary[] = [];
  filtered: OrganizationSummary[] = [];
  searchTerm = '';

  loading = true;
  error = false;

  constructor(
    private orgService: OrganizationsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOrganizations();
  }

  loadOrganizations(): void {
    this.loading = true;
    this.error = false;
    this.orgService.getAll().subscribe({
      next: (data) => {
        this.organizations = data;
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filtered = this.organizations;
      return;
    }
    this.filtered = this.organizations.filter(org =>
      org.razonSocial.toLowerCase().includes(term) ||
      org.ruc.toLowerCase().includes(term) ||
      org.ciudad.toLowerCase().includes(term)
    );
  }

  viewDetail(id: string): void {
    this.router.navigate(['/organizations', id]);
  }

  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      'Registrada': 'estado-registrada',
      'Activa': 'estado-activa',
      'Inactiva': 'estado-inactiva'
    };
    return map[estado] || '';
  }
}
