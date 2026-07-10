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
import { DatePickerModule } from 'primeng/datepicker';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
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
    SelectModule,
    DatePickerModule,
    ToggleSwitchModule
  ],
  templateUrl: './organizations-placeholder.html',
  styleUrl: './organizations-placeholder.scss'
})
export class OrganizationsPlaceholderComponent implements OnInit {

  organizations: OrganizationSummary[] = [];
  filtered: OrganizationSummary[] = [];
  paginatedOrganizations: OrganizationSummary[] = [];
  searchTerm = '';
  filterTipo = 'TODOS';
  showInactive = false;
  
  fechaDesdeObj: Date | null = null;
  fechaHastaObj: Date | null = null;

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
        (org.ciudad && org.ciudad.toLowerCase().includes(term)) ||
        (org.nombreComercial && org.nombreComercial.toLowerCase().includes(term)) ||
        (org.email && org.email.toLowerCase().includes(term)) ||
        (org.sectorBarrio && org.sectorBarrio.toLowerCase().includes(term)) ||
        (org.direccion && org.direccion.toLowerCase().includes(term))
      );

      // Filtro por estado (inactivas)
      const matchesEstado = this.showInactive ? true : org.estado !== 'Inactiva';

      // Filtro por tipo
      const matchesTipo = this.filterTipo === 'TODOS' || org.tipoOrganizacion?.nombre === this.filterTipo;

      // Filtro por fechas (sobre fechaRegistro)
      let matchesDate = true;
      if (this.fechaDesdeObj || this.fechaHastaObj) {
        if (org.fechaRegistro) {
          const regDate = new Date(org.fechaRegistro);
          regDate.setHours(0, 0, 0, 0);

          if (this.fechaDesdeObj) {
            const desde = new Date(this.fechaDesdeObj);
            desde.setHours(0, 0, 0, 0);
            if (regDate < desde) matchesDate = false;
          }

          if (this.fechaHastaObj) {
            const hasta = new Date(this.fechaHastaObj);
            hasta.setHours(0, 0, 0, 0);
            if (regDate > hasta) matchesDate = false;
          }
        } else {
          // If the organization doesn't have a registration date but we are filtering by date
          matchesDate = false;
        }
      }

      return matchesSearch && matchesEstado && matchesTipo && matchesDate;
    });
    this.totalItems = this.filtered.length;
    this.pageIndex = 0;
    this.updatePagination();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchTerm ||
      this.filterTipo !== 'TODOS' ||
      this.fechaDesdeObj ||
      this.fechaHastaObj ||
      this.showInactive
    );
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
    this.filterTipo = 'TODOS';
    this.showInactive = false;
    this.fechaDesdeObj = null;
    this.fechaHastaObj = null;
    this.applyFilter();
  }

  exportExcel(): void {
    this.exportLoading = true;
    this.cdr.detectChanges();

    const currentEstado = this.showInactive ? 'TODOS' : 'Activa';
    this.orgService.exportExcel(this.searchTerm, currentEstado, this.filterTipo).subscribe({
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
