import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { finalize } from 'rxjs/operators';
import { RolesService, Role } from '../roles.service';
import { RoleFormComponent } from '../role-form/role-form';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatPaginatorModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SelectModule
  ],
  templateUrl: './roles-list.html',
  styleUrl: './roles-list.scss'
})
export class RolesListComponent implements OnInit {

  allRoles: Role[] = [];
  filteredRoles: Role[] = [];
  paginatedRoles: Role[] = [];
  loading = true;
  error: string | null = null;

  // Filtros
  filters = {
    search: '',
    perfilAcceso: '',
    estado: ''
  };

  // Stats
  stats = {
    total: 0,
    activos: 0,
    inactivos: 0,
    base: 0,
    custom: 0
  };

  // Paginación
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;

  constructor(
    private rolesService: RolesService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    this.rolesService.getAll()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.allRoles = data || [];
          this.calculateStats();
          this.applyFilters();
        },
        error: (err) => {
          console.error('Error loading roles:', err);
          this.error = 'No se pudieron cargar los roles.';
          this.allRoles = [];
          this.calculateStats();
          this.applyFilters();
        }
      });
  }

  calculateStats(): void {
    const officialRoles = ['Administrador', 'Gestión Social', 'Auditor'];
    this.stats.total = this.allRoles.length;
    this.stats.activos = this.allRoles.filter(r => r.estado === 'Activo').length;
    this.stats.inactivos = this.allRoles.filter(r => r.estado === 'Inactivo').length;
    this.stats.base = this.allRoles.filter(r => officialRoles.includes(r.nombre)).length;
    this.stats.custom = this.allRoles.filter(r => !officialRoles.includes(r.nombre)).length;
  }

  applyFilters(): void {
    this.filteredRoles = this.allRoles.filter(role => {
      // Búsqueda por nombre o descripción
      if (this.filters.search) {
        const query = this.filters.search.toLowerCase();
        const matchSearch = role.nombre.toLowerCase().includes(query) || (role.descripcion || '').toLowerCase().includes(query);
        if (!matchSearch) return false;
      }

      // Filtro por perfilAcceso
      if (this.filters.perfilAcceso) {
        if (role.perfilAcceso !== this.filters.perfilAcceso) return false;
      }

      // Filtro por estado
      if (this.filters.estado) {
        if (role.estado !== this.filters.estado) return false;
      }

      return true;
    });

    this.totalItems = this.filteredRoles.length;
    this.pageIndex = 0;
    this.updatePagination();
  }

  clearFilters(): void {
    this.filters = { search: '', perfilAcceso: '', estado: '' };
    this.applyFilters();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagination();
  }

  updatePagination(): void {
    const start = this.pageIndex * this.pageSize;
    this.paginatedRoles = this.filteredRoles.slice(start, start + this.pageSize);
    this.cdr.detectChanges();
  }

  createRole(): void {
    const dialogRef = this.dialog.open(RoleFormComponent, {
      width: '550px',
      disableClose: true,
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadRoles();
    });
  }

  editRole(role: Role): void {
    const dialogRef = this.dialog.open(RoleFormComponent, {
      width: '550px',
      disableClose: true,
      data: { mode: 'edit', role }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadRoles();
    });
  }

  viewRoleDetail(role: Role): void {
    this.dialog.open(RoleFormComponent, {
      width: '600px',
      disableClose: false,
      data: { mode: 'detail', role }
    });
  }

  deactivateRole(role: Role): void {
    if (role.nombre === 'Administrador') {
      this.snackBar.open('Por seguridad, no se puede desactivar el rol Administrador.', 'Cerrar', { duration: 4000 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Desactivar rol',
        message: `¿Está seguro de desactivar el rol "${role.nombre}"?`,
        secondaryText: 'Los usuarios con este rol podrían perder accesos en el sistema.',
        confirmText: 'Desactivar',
        cancelText: 'Cancelar',
        confirmColor: 'warn'
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.rolesService.deactivate(role.id).subscribe({
          next: () => {
            this.snackBar.open('Rol desactivado exitosamente', 'Cerrar', { duration: 3000 });
            this.loadRoles();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error al desactivar el rol', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  activateRole(role: Role): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Reactivar rol',
        message: `¿Está seguro de reactivar el rol "${role.nombre}"?`,
        secondaryText: 'El rol volverá a estar disponible para asignarlo a los usuarios.',
        confirmText: 'Reactivar',
        cancelText: 'Cancelar',
        confirmColor: 'primary'
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.rolesService.activate(role.id).subscribe({
          next: () => {
            this.snackBar.open('Rol reactivado exitosamente', 'Cerrar', { duration: 3000 });
            this.loadRoles();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error al reactivar el rol', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  getEstadoClass(estado: string): string {
    return estado === 'Activo' ? 'estado-activa' : 'estado-inactiva';
  }

  getPerfilClass(perfil: string): string {
    if (perfil === 'Administrador') return 'perfil-admin';
    if (perfil === 'Gestión Social') return 'perfil-social';
    if (perfil === 'Auditor') return 'perfil-auditor';
    return 'perfil-default';
  }
}
