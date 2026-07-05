import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { finalize } from 'rxjs/operators';
import {
  OrganizationsService,
  OrganizationSummary
} from '../organizations.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { AuthService } from '../../../core/auth/auth.service';

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
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatPaginatorModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SelectModule
  ],
  templateUrl: './organizations-placeholder.html',
  styleUrl: './organizations-placeholder.scss'
})
export class OrganizationsPlaceholderComponent implements OnInit {

  organizations: OrganizationSummary[] = [];
  filtered: OrganizationSummary[] = [];
  paginatedOrganizations: OrganizationSummary[] = [];
  searchTerm = '';
  filterEstado = 'Activa';
  filterTipo = 'TODOS';
  
  estadoOptions = [
    { label: 'Todos los estados', value: 'TODOS' },
    { label: 'Registradas', value: 'Registrada' },
    { label: 'Activas', value: 'Activa' },
    { label: 'Inactivas', value: 'Inactiva' }
  ];
  tiposOptions: {label: string, value: string}[] = [];

  loading = true;
  error: string | null = null;

  // Paginación
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;

  constructor(
    private orgService: OrganizationsService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadOrganizations();
  }

  loadOrganizations(): void {
    this.loading = true;
    this.error = null;

    // Cargamos TODAS (incluyendo inactivas) para poder filtrarlas en el frontend
    this.orgService.getAll(true)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.organizations = data ?? [];
          this.extractTipos();
          this.applyFilter();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading organizations:', err);
          this.error = 'No se pudieron cargar las organizaciones.';
          this.organizations = [];
          this.filtered = [];
          this.applyFilter();
          this.cdr.detectChanges();
        }
      });
  }

  extractTipos(): void {
    const tipos = Array.from(new Set(this.organizations.map(o => o.tipoOrganizacion?.nombre).filter(Boolean)));
    this.tiposOptions = [
      { label: 'Todos los tipos', value: 'TODOS' },
      ...tipos.map(t => ({ label: t, value: t }))
    ];
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.applyFilter();
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    
    this.filtered = this.organizations.filter(org => {
      // Filtro por término
      const matchesSearch = !term || (
        (org.razonSocial && org.razonSocial.toLowerCase().includes(term)) ||
        (org.ruc && org.ruc.toLowerCase().includes(term)) ||
        (org.ciudad && org.ciudad.toLowerCase().includes(term))
      );

      // Filtro por estado
      const matchesEstado = this.filterEstado === 'TODOS' || org.estado === this.filterEstado;

      // Filtro por tipo
      const matchesTipo = this.filterTipo === 'TODOS' || org.tipoOrganizacion?.nombre === this.filterTipo;

      return matchesSearch && matchesEstado && matchesTipo;
    });
    this.totalItems = this.filtered.length;
    this.pageIndex = 0;
    this.updatePagination();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagination();
  }

  updatePagination(): void {
    const start = this.pageIndex * this.pageSize;
    this.paginatedOrganizations = this.filtered.slice(start, start + this.pageSize);
    this.cdr.detectChanges();
  }

  viewDetail(id: string): void {
    this.router.navigate(['/organizations', id]);
  }

  editOrganization(id: string): void {
    this.router.navigate(['/organizations', id, 'edit']);
  }

  createOrganization(): void {
    this.router.navigate(['/organizations/new']);
  }

  deactivateOrganization(id: string, razonSocial: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Desactivar organización',
        message: `¿Está seguro de desactivar la organización "${razonSocial}"? Esta acción no eliminará el registro, solo cambiará su estado a Inactiva.`,
        secondaryText: 'Podrá consultar el registro posteriormente, pero no se considerará activo para la gestión operativa.',
        confirmText: 'Desactivar',
        cancelText: 'Cancelar',
        confirmColor: 'warn'
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.loading = true;
        this.error = null;
        
        this.orgService.deactivateOrganization(id)
          .pipe(finalize(() => {}))
          .subscribe({
            next: () => {
              this.loadOrganizations();
            },
            error: (err) => {
              console.error('Error deactivating organization:', err);
              this.error = err?.error?.message || 'No se pudo desactivar la organización. Por favor intente de nuevo.';
              this.loading = false;
              this.cdr.detectChanges();
            }
          });
      }
    });
  }

  activateOrganization(id: string, razonSocial: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Reactivar organización',
        message: `¿Está seguro de reactivar esta organización? El registro volverá a estar disponible para la gestión operativa.`,
        confirmText: 'Reactivar organización',
        cancelText: 'Cancelar',
        confirmColor: 'primary'
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.loading = true;
        this.error = null;
        
        this.orgService.activateOrganization(id)
          .pipe(finalize(() => {}))
          .subscribe({
            next: () => {
              this.loadOrganizations();
            },
            error: (err) => {
              console.error('Error activating organization:', err);
              this.error = err?.error?.message || 'No se pudo reactivar la organización. Por favor intente de nuevo.';
              this.loading = false;
              this.cdr.detectChanges();
            }
          });
      }
    });
  }

  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      'Registrada': 'estado-registrada',
      'Activa': 'estado-activa',
      'Activo': 'estado-activa',
      'Inactiva': 'estado-inactiva',
      'Inactivo': 'estado-inactiva'
    };
    return map[estado] || '';
  }

  exportLoading = false;

  clearFilters(): void {
    this.searchTerm = '';
    this.filterEstado = 'Activa';
    this.filterTipo = 'TODOS';
    this.applyFilter();
  }

  exportExcel(): void {
    this.exportLoading = true;
    this.cdr.detectChanges();

    this.orgService.exportExcel(this.searchTerm, this.filterEstado, this.filterTipo).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Organizaciones_BADI_${new Date().getTime()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.exportLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error exporting excel:', err);
        this.exportLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
