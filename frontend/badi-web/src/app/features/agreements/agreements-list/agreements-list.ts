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
    MatProgressSpinnerModule
  ],
  templateUrl: './agreements-list.html',
  styleUrls: ['./agreements-list.scss']
})
export class AgreementsListComponent implements OnInit {
  agreements: Agreement[] = [];
  loading = true;
  error: string | null = null;
  displayedColumns: string[] = ['codigo', 'organizacion', 'tipo', 'estado', 'fechaInicio', 'acciones'];

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
        },
        error: (err) => {
          this.error = 'Error al cargar convenios';
          this.snackBar.open('Error al cargar convenios', 'Cerrar', { duration: 3000 });
        }
      });
  }

  openAgreementForm(agreement?: Agreement) {
    const dialogRef = this.dialog.open(AgreementFormDialogComponent, {
      width: '600px',
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

  deactivateAgreement(id: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Anular Convenio',
        message: '¿Estás seguro de que deseas anular este convenio? Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.agreementsService.deactivate(id).subscribe({
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
}
