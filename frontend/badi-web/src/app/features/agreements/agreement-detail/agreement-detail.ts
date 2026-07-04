import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { AgreementsService, Agreement } from '../agreements.service';
import { AgreementFormDialogComponent } from '../agreement-form-dialog/agreement-form-dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { ScheduleService, ScheduledDelivery } from '../../schedule/schedule.service';
import { ScheduleFormDialogComponent } from '../../schedule/schedule-form-dialog/schedule-form-dialog';
import { DocumentSectionComponent } from '../../documents/document-section/document-section';

@Component({
  selector: 'app-agreement-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    RouterModule,
    ButtonModule,
    DocumentSectionComponent
  ],
  templateUrl: './agreement-detail.html',
  styleUrls: ['../../organizations/organization-detail/organization-detail.scss', './agreement-detail.scss']
})
export class AgreementDetailComponent implements OnInit {
  agreement: Agreement | null = null;
  loading = true;
  error: string | null = null;

  // Cronograma
  deliveries: ScheduledDelivery[] = [];
  deliveriesLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private agreementsService: AgreementsService,
    private scheduleService: ScheduleService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAgreement(id);
    } else {
      this.error = 'No se proporcionó un ID de convenio válido.';
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  loadAgreement(id: string): void {
    this.loading = true;
    this.error = null;

    this.agreementsService.getById(id)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.agreement = data;
          this.loadDeliveries(id);
        },
        error: () => {
          this.error = 'No se pudo cargar el detalle del convenio.';
          this.agreement = null;
        }
      });
  }

  loadDeliveries(agreementId: string): void {
    this.deliveriesLoading = true;
    this.scheduleService.getByAgreement(agreementId).subscribe({
      next: (data) => {
        this.deliveries = data;
        this.deliveriesLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.deliveriesLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/agreements']);
  }

  openAgreementForm(): void {
    if (!this.agreement) return;
    
    const dialogRef = this.dialog.open(AgreementFormDialogComponent, {
      width: '600px',
      panelClass: 'badi-dialog-panel',
      disableClose: true,
      data: {
        organizationId: this.agreement.organizacion.id,
        agreement: this.agreement,
        disableOrgSelect: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAgreement(this.agreement!.id);
      }
    });
  }

  activateAgreement(): void {
    if (!this.agreement) return;
    const tipoInfo = this.agreement.tipoConvenio;
    let rulesText = '';
    if (tipoInfo?.duracionMeses) {
      rulesText += `\n• Duración: ${tipoInfo.duracionMeses} meses.`;
    }
    if (tipoInfo?.maxRetiros) {
      rulesText += `\n• Máximo de retiros: ${tipoInfo.maxRetiros}.`;
    }
    if (!tipoInfo?.duracionMeses && !tipoInfo?.maxRetiros) {
      rulesText = '\n• El tipo de convenio no tiene restricciones automáticas configuradas.';
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Activar convenio',
        message: '¿Está seguro de activar este convenio? Se registrará la fecha de activación y se aplicarán las reglas configuradas en el tipo de convenio.',
        secondaryText: `Reglas del tipo "${tipoInfo?.nombre}":${rulesText}`,
        confirmText: 'Activar convenio',
        cancelText: 'Cancelar',
        confirmColor: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.agreementsService.activate(this.agreement!.id).subscribe({
          next: () => {
            this.snackBar.open('Convenio activado exitosamente', 'Cerrar', { duration: 3000 });
            this.loadAgreement(this.agreement!.id);
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error al activar el convenio', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  finalizeAgreement(): void {
    if (!this.agreement) return;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Finalizar convenio',
        message: '¿Está seguro de finalizar este convenio? El convenio quedará como histórico y no podrá seguir operando como convenio vigente.',
        secondaryText: 'Esta acción no se puede deshacer. El convenio conservará su historial completo.',
        confirmText: 'Finalizar convenio',
        cancelText: 'Cancelar',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.agreementsService.finalize(this.agreement!.id).subscribe({
          next: () => {
            this.snackBar.open('Convenio finalizado exitosamente', 'Cerrar', { duration: 3000 });
            this.loadAgreement(this.agreement!.id);
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error al finalizar el convenio', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  deactivateAgreement(): void {
    if (!this.agreement) return;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Anular Convenio',
        message: '¿Estás seguro de que deseas anular este convenio? Esta acción no se puede deshacer.',
        secondaryText: 'El convenio quedará registrado con estado Anulado y no podrá reactivarse.',
        confirmText: 'Anular convenio',
        cancelText: 'Cancelar',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.agreementsService.deactivate(this.agreement!.id).subscribe({
          next: () => {
            this.snackBar.open('Convenio anulado exitosamente', 'Cerrar', { duration: 3000 });
            this.loadAgreement(this.agreement!.id);
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error al anular el convenio', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      'Registrado': 'estado-registrada',
      'Activo': 'estado-activa',
      'Finalizado': 'estado-finalizada',
      'Anulado': 'estado-inactiva',
      'Inactivo': 'estado-inactiva'
    };
    return map[estado] || '';
  }

  isHistorico(): boolean {
    if (!this.agreement) return false;
    return this.agreement.estado === 'Anulado' || this.agreement.estado === 'Finalizado';
  }

  // ── Cronograma ─────────────────────────

  openScheduleForm(): void {
    if (!this.agreement) return;

    const dialogRef = this.dialog.open(ScheduleFormDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        fecha: new Date(),
        agreementId: this.agreement.id
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.agreement) {
        this.loadDeliveries(this.agreement.id);
      }
    });
  }

  getDeliveryEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      'Programado': 'delivery-programado',
      'Reprogramado': 'delivery-reprogramado',
      'Cancelado': 'delivery-cancelado'
    };
    return map[estado] || '';
  }

  // ── Reportes ───────────────────────────
  
  reportLoading = false;

  downloadReport(): void {
    if (!this.agreement) return;
    this.reportLoading = true;
    
    this.agreementsService.downloadReport(this.agreement.id)
      .pipe(finalize(() => {
        this.reportLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Reporte-Convenio-${this.agreement!.codigoConvenio || 'Generado'}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        },
        error: () => {
          this.snackBar.open('Error al descargar el reporte', 'Cerrar', { duration: 3000 });
        }
      });
  }
}
