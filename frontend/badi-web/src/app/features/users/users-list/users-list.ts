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
import { UsersService, User } from '../users.service';
import { RolesService, Role } from '../../roles/roles.service';
import { AuthService } from '../../../core/auth/auth.service';
import { UserFormComponent } from '../user-form/user-form';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-users-list',
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
  templateUrl: './users-list.html',
  styleUrl: './users-list.scss'
})
export class UsersListComponent implements OnInit {

  allUsers: User[] = [];
  filteredUsers: User[] = [];
  paginatedUsers: User[] = [];
  roles: Role[] = [];
  loading = true;
  error: string | null = null;

  // Filtros
  filters = {
    search: '',
    rolId: '',
    estado: '',
    requiereCambio: null as boolean | null
  };

  // Stats
  stats = {
    total: 0,
    activos: 0,
    inactivos: 0,
    admins: 0,
    requiereCambio: 0
  };

  // Paginación
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;

  constructor(
    private usersService: UsersService,
    private rolesService: RolesService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadRoles();
    this.loadUsers();
  }

  loadRoles(): void {
    this.rolesService.getAllActive().subscribe({
      next: (data) => {
        this.roles = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading roles:', err)
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    this.usersService.getAll()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.allUsers = data || [];
          this.calculateStats();
          this.applyFilters();
        },
        error: (err) => {
          console.error('Error loading users:', err);
          this.error = 'No se pudieron cargar los usuarios.';
          this.allUsers = [];
          this.calculateStats();
          this.applyFilters();
        }
      });
  }

  calculateStats(): void {
    this.stats.total = this.allUsers.length;
    this.stats.activos = this.allUsers.filter(u => u.estado === 'Activo').length;
    this.stats.inactivos = this.allUsers.filter(u => u.estado === 'Inactivo').length;
    this.stats.admins = this.allUsers.filter(u => u.roles?.some(r => r.nombre === 'Administrador')).length;
    this.stats.requiereCambio = this.allUsers.filter(u => u.requiereCambioPassword).length;
  }

  applyFilters(): void {
    this.filteredUsers = this.allUsers.filter(user => {
      // Búsqueda general
      if (this.filters.search) {
        const query = this.filters.search.toLowerCase();
        const fullName = `${user.nombres} ${user.apellidos}`.toLowerCase();
        const matchSearch = fullName.includes(query) || user.email.toLowerCase().includes(query);
        if (!matchSearch) return false;
      }

      // Filtro por rol
      if (this.filters.rolId) {
        const matchRole = user.roles?.some(r => r.id === this.filters.rolId);
        if (!matchRole) return false;
      }

      // Filtro por estado
      if (this.filters.estado) {
        if (user.estado !== this.filters.estado) return false;
      }

      // Filtro por requiereCambioPassword
      if (this.filters.requiereCambio !== null) {
        if (!!user.requiereCambioPassword !== this.filters.requiereCambio) return false;
      }

      return true;
    });

    this.totalItems = this.filteredUsers.length;
    this.pageIndex = 0;
    this.updatePagination();
  }

  clearFilters(): void {
    this.filters = { search: '', rolId: '', estado: '', requiereCambio: null };
    this.applyFilters();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagination();
  }

  updatePagination(): void {
    const start = this.pageIndex * this.pageSize;
    this.paginatedUsers = this.filteredUsers.slice(start, start + this.pageSize);
    this.cdr.detectChanges();
  }

  createUser(): void {
    const dialogRef = this.dialog.open(UserFormComponent, {
      width: '550px',
      disableClose: true,
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadUsers();
    });
  }

  editUser(user: User): void {
    const dialogRef = this.dialog.open(UserFormComponent, {
      width: '550px',
      disableClose: true,
      data: { mode: 'edit', user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadUsers();
    });
  }

  deactivateUser(user: User): void {
    if (this.isCurrentUser(user)) {
      this.snackBar.open('No puedes desactivar tu propia cuenta activa.', 'Cerrar', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Desactivar usuario',
        message: `¿Está seguro de desactivar al usuario "${user.nombres} ${user.apellidos}"?`,
        secondaryText: 'El usuario no podrá iniciar sesión en el sistema.',
        confirmText: 'Desactivar',
        cancelText: 'Cancelar',
        confirmColor: 'warn'
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.usersService.deactivate(user.id).subscribe({
          next: () => {
            this.snackBar.open('Usuario desactivado exitosamente', 'Cerrar', { duration: 3000 });
            this.loadUsers();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error al desactivar el usuario', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  activateUser(user: User): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Reactivar usuario',
        message: `¿Está seguro de reactivar al usuario "${user.nombres} ${user.apellidos}"?`,
        secondaryText: 'El usuario recuperará su acceso al sistema con su rol actual.',
        confirmText: 'Reactivar',
        cancelText: 'Cancelar',
        confirmColor: 'primary'
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.usersService.activate(user.id).subscribe({
          next: () => {
            this.snackBar.open('Usuario reactivado exitosamente', 'Cerrar', { duration: 3000 });
            this.loadUsers();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error al reactivar el usuario', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  isCurrentUser(user: User): boolean {
    return this.authService.getCurrentUser()?.id === user.id;
  }

  getEstadoClass(estado: string): string {
    return estado === 'Activo' ? 'estado-activa' : 'estado-inactiva';
  }
}
