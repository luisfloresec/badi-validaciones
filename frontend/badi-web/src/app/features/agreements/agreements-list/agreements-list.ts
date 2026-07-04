import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AgreementsService, Agreement } from '../agreements.service';
import { AgreementFormDialogComponent } from '../agreement-form-dialog/agreement-form-dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-agreements-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    RouterModule
  ],
  templateUrl: './agreements-list.html',
  styleUrls: ['./agreements-list.scss']
})
export class AgreementsListComponent implements OnInit {
  agreements: Agreement[] = [];
  paginatedAgreements: Agreement[] = [];
  loading = true;
  error: string | null = null;
  displayedColumns: string[] = [
    'codigo', 'organizacion', 'tipo', 'estado',
    'fechaInicio', 'fechaActivacion', 'fechaFinEstimada',
    'retirosRealizados', 'acciones'
  ];

  // Paginación
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;

  constructor(
    private agreementsService: AgreementsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAgreements();
  }

  loadAgreements() {
    this.loading = true;
    this.error = null;
    this.agreementsService.getAll()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          this.agreements = res;
          this.totalItems = this.agreements.length;
          this.pageIndex = 0;
          this.updatePagination();
        },
        error: (err) => {
          this.error = 'Error al cargar convenios';
          this.agreements = [];
          this.totalItems = 0;
          this.updatePagination();
          this.snackBar.open('Error al cargar convenios', 'Cerrar', { duration: 3000 });
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagination();
  }

  updatePagination(): void {
    const start = this.pageIndex * this.pageSize;
    this.paginatedAgreements = this.agreements.slice(start, start + this.pageSize);
    this.cdr.detectChanges();
  }

  openAgreementForm(agreement?: Agreement) {
    const dialogRef = this.dialog.open(AgreementFormDialogComponent, {
      width: '600px',
      panelClass: 'badi-dialog-panel',
      disableClose: true,
      data: {
        agreement: agreement,
        disableOrgSelect: !!agreement
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadAgreements();
    });
  }

  activateAgreement(agreement: Agreement) {
    const tipoInfo = agreement.tipoConvenio;
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
        this.agreementsService.activate(agreement.id).subscribe({
          next: () => {
            this.snackBar.open('Convenio activado exitosamente', 'Cerrar', { duration: 3000 });
            this.loadAgreements();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error al activar el convenio', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  finalizeAgreement(agreement: Agreement) {
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
        this.agreementsService.finalize(agreement.id).subscribe({
          next: () => {
            this.snackBar.open('Convenio finalizado exitosamente', 'Cerrar', { duration: 3000 });
            this.loadAgreements();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error al finalizar el convenio', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  deactivateAgreement(agreement: Agreement) {
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
        this.agreementsService.deactivate(agreement.id).subscribe({
          next: () => {
            this.snackBar.open('Convenio anulado exitosamente', 'Cerrar', { duration: 3000 });
            this.loadAgreements();
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

  isHistorico(estado: string): boolean {
    return estado === 'Anulado' || estado === 'Finalizado';
  }

  exportLoading = false;

  exportExcel(): void {
    this.exportLoading = true;
    this.cdr.detectChanges();

    this.agreementsService.exportExcel().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Convenios_BADI_${new Date().getTime()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.exportLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error exporting excel:', err);
        this.snackBar.open('Error al exportar el listado a Excel', 'Cerrar', { duration: 3000 });
        this.exportLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
