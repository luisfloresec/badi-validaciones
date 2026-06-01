import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';
import {
  OrganizationsService,
  OrganizationFullDetail
} from '../organizations.service';

import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { RepresentativeFormDialogComponent } from './representative-form-dialog/representative-form-dialog';
import { GroupLeaderFormDialogComponent } from './group-leader-form-dialog/group-leader-form-dialog';
import { LeaderFormDialogComponent } from './leader-form-dialog/leader-form-dialog';
import { AgreementFormDialogComponent } from '../../agreements/agreement-form-dialog/agreement-form-dialog';
import { AgreementsService } from '../../agreements/agreements.service';

@Component({
  selector: 'app-organization-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './organization-detail.html',
  styleUrl: './organization-detail.scss'
})
export class OrganizationDetailComponent implements OnInit {

  detail: OrganizationFullDetail | null = null;
  loading = true;
  deactivating = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orgService: OrganizationsService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private agreementsService: AgreementsService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDetail(id);
    } else {
      this.error = 'No se proporcionó un ID de organización válido.';
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  loadDetail(id: string): void {
    this.loading = true;
    this.error = null;

    this.orgService.getFullDetail(id)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.detail = data;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading organization detail:', err);
          this.error = 'No se pudo cargar el detalle de la organización.';
          this.detail = null;
          this.cdr.detectChanges();
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/organizations']);
  }

  editOrganization(): void {
    if (this.detail?.organizacion?.id) {
      this.router.navigate(['/organizations', this.detail.organizacion.id, 'edit']);
    }
  }

  deactivateOrganization(): void {
    if (!this.detail?.organizacion) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Desactivar organización',
        message: `¿Está seguro de desactivar esta organización? Esta acción no eliminará el registro, pero cambiará su estado a Inactiva.`,
        secondaryText: 'Podrá consultar el registro posteriormente, pero no se considerará activo para la gestión operativa.',
        confirmText: 'Desactivar organización',
        cancelText: 'Cancelar',
        confirmColor: 'warn'
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.deactivating = true;
        this.error = null;
        
        this.orgService.deactivateOrganization(this.detail!.organizacion.id)
          .pipe(finalize(() => {
            this.deactivating = false;
            this.cdr.detectChanges();
          }))
          .subscribe({
            next: () => {
              this.router.navigate(['/organizations']);
            },
            error: (err) => {
              console.error('Error deactivating organization:', err);
              this.error = err?.error?.message || 'No se pudo desactivar la organización. Por favor intente de nuevo.';
              this.cdr.detectChanges();
              window.scrollTo(0, 0); // Scroll top to see the error banner if any
            }
          });
      }
    });
  }

  activateOrganization(): void {
    if (!this.detail) return;
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
        this.deactivating = true; // reusing the same spinner variable
        this.error = null;
        this.cdr.detectChanges();
        
        this.orgService.activateOrganization(this.detail!.organizacion.id)
          .pipe(finalize(() => {
            this.deactivating = false;
            this.cdr.detectChanges();
          }))
          .subscribe({
            next: () => {
              this.router.navigate(['/organizations']);
            },
            error: (err) => {
              console.error('Error activating organization:', err);
              this.error = err?.error?.message || 'No se pudo reactivar la organización. Por favor intente de nuevo.';
              this.cdr.detectChanges();
              window.scrollTo(0, 0); // Scroll top to see the error banner if any
            }
          });
      }
    });
  }

  get activeRepresentative() {
    if (!this.detail?.representantes) return null;
    return this.detail.representantes.find(r => r.estado === 'Activo' && r.esPrincipal === true) || null;
  }

  openRepresentativeForm(mode: 'create' | 'replace'): void {
    if (!this.detail) return;
    
    const dialogRef = this.dialog.open(RepresentativeFormDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        organizationId: this.detail.organizacion.id,
        mode
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDetail(this.detail!.organizacion.id);
      }
    });
  }

  editRepresentative(): void {
    if (!this.detail || !this.activeRepresentative) return;

    const dialogRef = this.dialog.open(RepresentativeFormDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        organizationId: this.detail.organizacion.id,
        mode: 'edit',
        representativeData: this.activeRepresentative
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDetail(this.detail!.organizacion.id);
      }
    });
  }

  // --- GRUPOS ATENDIDOS ---

  openGroupForm(mode: 'create' | 'edit', groupData?: any): void {
    if (!this.detail) return;

    const dialogRef = this.dialog.open(GroupLeaderFormDialogComponent, {
      width: '700px',
      disableClose: true,
      data: {
        organizationId: this.detail.organizacion.id,
        hasActiveRepresentative: !!this.activeRepresentative,
        mode,
        groupData
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDetail(this.detail!.organizacion.id);
      }
    });
  }

  openAgreementForm(): void {
    if (!this.detail || this.detail.organizacion.estado === 'Inactiva') return;
    
    const dialogRef = this.dialog.open(AgreementFormDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        organizationId: this.detail.organizacion.id,
        disableOrgSelect: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDetail(this.detail!.organizacion.id);
      }
    });
  }

  editAgreement(conv: any): void {
    if (!this.detail || this.detail.organizacion.estado === 'Inactiva') return;
    
    const dialogRef = this.dialog.open(AgreementFormDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        organizationId: this.detail.organizacion.id,
        agreement: conv,
        disableOrgSelect: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDetail(this.detail!.organizacion.id);
      }
    });
  }

  deactivateAgreement(convId: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Anular Convenio',
        message: '¿Estás seguro de que deseas anular este convenio? Esta acción lo marcará como anulado pero no lo eliminará.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.agreementsService.deactivate(convId).subscribe({
          next: () => {
            this.snackBar.open('Convenio anulado exitosamente', 'Cerrar', { duration: 3000 });
            this.loadDetail(this.detail!.organizacion.id);
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error al anular el convenio', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  deactivateGroup(groupId: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Desactivar grupo',
        message: '¿Está seguro de que desea desactivar este grupo atendido? Esta acción lo ocultará de los procesos activos.',
        confirmText: 'Desactivar',
        cancelText: 'Cancelar',
        isDestructive: true
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.orgService.deactivateAttendedGroup(groupId).subscribe({
          next: () => {
            this.loadDetail(this.detail!.organizacion.id);
          },
          error: (err) => {
            console.error('Error deactivating group:', err);
            this.error = err?.error?.message || 'No se pudo desactivar el grupo.';
            this.cdr.detectChanges();
            window.scrollTo(0, 0);
          }
        });
      }
    });
  }

  // --- DIRIGENTES ---

  getActiveLeader(groupItem: any): any {
    if (!groupItem.dirigentes) return null;
    return groupItem.dirigentes.find((d: any) => d.estado === 'Activo') || null;
  }

  openLeaderForm(groupId: string, mode: 'create' | 'edit' | 'replace', leaderData?: any): void {
    if (!this.detail) return;

    const dialogRef = this.dialog.open(LeaderFormDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        groupId,
        hasActiveRepresentative: !!this.activeRepresentative,
        mode,
        leaderData
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDetail(this.detail!.organizacion.id);
      }
    });
  }

  deactivateLeader(leaderId: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Inactivar dirigente',
        message: '¿Está seguro de inactivar este dirigente? Esta acción no eliminará el registro, pero dejará de considerarse vigente para este grupo atendido. Si esta persona también es representante de la organización u ocupa otros roles, esos registros no serán modificados.',
        confirmText: 'Inactivar dirigente',
        cancelText: 'Cancelar',
        isDestructive: true
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.orgService.deactivateLeader(leaderId).subscribe({
          next: () => {
            this.loadDetail(this.detail!.organizacion.id);
          },
          error: (err) => {
            console.error('Error deactivating leader:', err);
            this.error = err?.error?.message || 'No se pudo inactivar el dirigente.';
            this.cdr.detectChanges();
            window.scrollTo(0, 0);
          }
        });
      }
    });
  }

  isGad(): boolean {
    return this.detail?.organizacion?.tipoOrganizacion?.nombre === 'GAD';
  }

  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      'Registrada': 'estado-registrada',
      'Activa': 'estado-activa',
      'Inactiva': 'estado-inactiva'
    };
    return map[estado] || '';
  }

  getRepresentativeName(id: string | null): string {
    if (!id || !this.detail) return '—';
    const rep = this.detail.representantes.find(r => r.id === id);
    return rep ? `${rep.nombres} ${rep.apellidos}` : '—';
  }

  formatCurrency(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return 'No especificado';
    }
  
    const numericValue = Number(value);
  
    if (Number.isNaN(numericValue)) {
      return 'No especificado';
    }
  
    return `$${numericValue.toFixed(2)}`;
  }

  hasSocialNetworks(): boolean {
    if (!this.detail?.organizacion?.redesSociales) return false;
    const redes = this.detail.organizacion.redesSociales;
    return Object.keys(redes).length > 0;
  }

  getSocialNetworks(): { label: string; value: string; isUrl: boolean }[] {
    if (!this.detail?.organizacion?.redesSociales) return [];

    const mapLabels: Record<string, string> = {
      facebook: 'Facebook',
      instagram: 'Instagram',
      whatsapp: 'WhatsApp',
      pagina_web: 'Página web',
      tiktok: 'TikTok',
      x_twitter: 'X / Twitter'
    };

    return Object.entries(this.detail.organizacion.redesSociales).map(([key, value]) => {
      let label = mapLabels[key] || 'Otro';
      
      // Manejar "Otro" dinámico o desconocidos (ej: otro_1, otro_2)
      if (!mapLabels[key] && key.startsWith('otro')) {
        label = 'Otro';
      } else if (!mapLabels[key]) {
        // Capitalizar y quitar guiones bajos si es algo totalmente desconocido
        label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }

      // Validar si parece URL
      const isUrl = /^(http|https):\/\/[^ "]+$/.test(value as string);

      return {
        label,
        value: value as string,
        isUrl
      };
    });
  }
}
