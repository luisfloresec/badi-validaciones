import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';
import { RolesService, Role } from '../roles.service';
import { RoleFormComponent } from '../role-form/role-form';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './roles-list.html',
  styleUrl: './roles-list.scss'
})
export class RolesListComponent implements OnInit {

  roles: Role[] = [];
  loading = true;
  error: string | null = null;

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

    this.rolesService.getAll()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.roles = data || [];
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading roles:', err);
          this.error = 'No se pudieron cargar los roles.';
          this.roles = [];
          this.cdr.detectChanges();
        }
      });
  }

  createRole(): void {
    const dialogRef = this.dialog.open(RoleFormComponent, {
      width: '500px',
      disableClose: true,
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadRoles();
    });
  }

  editRole(role: Role): void {
    const dialogRef = this.dialog.open(RoleFormComponent, {
      width: '500px',
      disableClose: true,
      data: { mode: 'edit', role }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadRoles();
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
        secondaryText: 'Los usuarios con este rol podrían perder accesos.',
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
        secondaryText: 'El rol volverá a estar disponible para asignar.',
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
}
