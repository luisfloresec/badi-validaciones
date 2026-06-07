import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AgreementsService, AgreementType } from '../agreements.service';
import { AgreementTypeFormDialogComponent } from '../agreement-type-form-dialog/agreement-type-form-dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-agreement-types-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    RouterModule
  ],
  templateUrl: './agreement-types-list.html',
  styleUrls: ['../agreements-list/agreements-list.scss']
})
export class AgreementTypesListComponent implements OnInit {
  types: AgreementType[] = [];
  loading = true;
  error: string | null = null;
  displayedColumns: string[] = ['nombre', 'descripcion', 'reglas', 'estado', 'acciones'];

  constructor(
    private agreementsService: AgreementsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadTypes();
  }

  loadTypes() {
    this.loading = true;
    this.error = null;
    this.agreementsService.getAllTypes()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res) => this.types = res,
        error: () => {
          this.error = 'Error al cargar tipos de convenio';
          this.snackBar.open('Error al cargar tipos de convenio', 'Cerrar', { duration: 3000 });
        }
      });
  }

  openTypeForm(type?: AgreementType) {
    const dialogRef = this.dialog.open(AgreementTypeFormDialogComponent, {
      width: '600px',
      disableClose: true,
      data: { type }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadTypes();
    });
  }

  deactivateType(type: AgreementType) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Inactivar tipo de convenio',
        message: '¿Está seguro de inactivar este tipo de convenio?',
        secondaryText: 'No podrá ser seleccionado para nuevos convenios. Los convenios existentes que usan este tipo no se verán afectados.',
        confirmText: 'Inactivar',
        cancelText: 'Cancelar',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.agreementsService.deactivateType(type.id).subscribe({
          next: () => {
            this.snackBar.open('Tipo inactivado exitosamente', 'Cerrar', { duration: 3000 });
            this.loadTypes();
          },
          error: (err) => this.snackBar.open(err.error?.message || 'Error al inactivar', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }

  activateType(type: AgreementType) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Reactivar tipo de convenio',
        message: '¿Está seguro de reactivar este tipo de convenio?',
        secondaryText: 'Volverá a estar disponible para ser seleccionado en nuevos convenios.',
        confirmText: 'Reactivar',
        cancelText: 'Cancelar',
        confirmColor: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.agreementsService.activateType(type.id).subscribe({
          next: () => {
            this.snackBar.open('Tipo reactivado exitosamente', 'Cerrar', { duration: 3000 });
            this.loadTypes();
          },
          error: (err) => this.snackBar.open(err.error?.message || 'Error al reactivar', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }

  getReglasText(type: AgreementType): string {
    const parts = [];
    if (type.duracionMeses) parts.push(`Duración: ${type.duracionMeses} meses`);
    if (type.maxRetiros) parts.push(`Retiros: máx ${type.maxRetiros}`);
    if (parts.length === 0) return 'Control manual';
    return parts.join(' | ');
  }

  getEstadoClass(estado: string): string {
    return estado === 'Activo' ? 'estado-activa' : 'estado-inactiva';
  }
}
