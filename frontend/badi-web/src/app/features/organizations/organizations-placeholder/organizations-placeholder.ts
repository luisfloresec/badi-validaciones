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
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
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
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    ToggleSwitchModule
  ],
  templateUrl: './organizations-placeholder.html',
  styleUrl: './organizations-placeholder.scss'
})
export class OrganizationsPlaceholderComponent implements OnInit {

  organizations: OrganizationSummary[] = [];
  filtered: OrganizationSummary[] = [];
  searchTerm = '';
  showInactive = false;

  loading = true;
  error: string | null = null;

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

    this.orgService.getAll(this.showInactive)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.organizations = data ?? [];
          this.applyFilter();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading organizations:', err);
          this.error = 'No se pudieron cargar las organizaciones.';
          this.organizations = [];
          this.filtered = [];
          this.cdr.detectChanges();
        }
      });
  }

  toggleInactive(): void {
    this.loadOrganizations();
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
}
