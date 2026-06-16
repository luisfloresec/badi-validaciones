import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ScheduleService, ScheduledDelivery } from '../schedule.service';
import { ScheduleRescheduleDialogComponent } from '../schedule-reschedule-dialog/schedule-reschedule-dialog';
import { ScheduleCancelDialogComponent } from '../schedule-cancel-dialog/schedule-cancel-dialog';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-schedule-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './schedule-detail-dialog.html',
  styleUrls: ['./schedule-detail-dialog.scss']
})
export class ScheduleDetailDialogComponent implements OnInit {
  delivery: ScheduledDelivery | null = null;
  isLoading = true;
  error: string | null = null;

  // Tracking changes for calendar refresh
  hasChanges = false;

  // Edit mode
  editMode = false;
  editDescripcion = '';
  editObservaciones = '';
  isSaving = false;

  constructor(
    private scheduleService: ScheduleService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ScheduleDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: string },
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    queueMicrotask(() => this.loadDetail());
  }

  loadDetail(): void {
    if (!this.data?.id) {
      this.error = 'No se proporcionó un ID válido para cargar el detalle.';
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.delivery = null;
    this.cdr.markForCheck();

    this.scheduleService.getById(this.data.id)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (res) => {
          this.delivery = res;
        },
        error: (err) => {
          this.error = err.error?.message || 'Error al cargar el detalle de la entrega programada.';
          this.snackBar.open(this.error as string, 'Cerrar', { duration: 4000 });
        }
      });
  }

  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      'Programado': 'estado-programada',
      'Reprogramado': 'estado-reprogramada',
      'Cancelado': 'estado-cancelada',
      'Finalizado': 'estado-finalizada'
    };
    return map[estado] || '';
  }

  get isEditable(): boolean {
    return this.delivery?.estado === 'Programado' || this.delivery?.estado === 'Reprogramado';
  }

  get descripcionLength(): number {
    return this.editDescripcion?.length || 0;
  }

  // ── Edit Mode ──────────────────────────

  enterEditMode(): void {
    this.editDescripcion = this.delivery?.descripcion || '';
    this.editObservaciones = this.delivery?.observaciones || '';
    this.editMode = true;
  }

  cancelEditMode(): void {
    this.editMode = false;
  }

  saveEdit(): void {
    if (!this.delivery) return;
    if (this.editDescripcion.length > 300) return;

    this.isSaving = true;
    const payload: { descripcion?: string; observaciones?: string } = {
      descripcion: this.editDescripcion.trim() || undefined,
      observaciones: this.editObservaciones.trim() || undefined
    };

    this.scheduleService.update(this.delivery.id, payload).subscribe({
      next: (updated) => {
        this.delivery = updated;
        this.editMode = false;
        this.isSaving = false;
        this.hasChanges = true;
        this.snackBar.open('Entrega actualizada exitosamente', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        const message = err.error?.message || 'Error al actualizar la entrega';
        this.snackBar.open(
          Array.isArray(message) ? message.join('. ') : message,
          'Cerrar',
          { duration: 5000 }
        );
        this.isSaving = false;
      }
    });
  }

  // ── Reschedule ─────────────────────────

  openReschedule(): void {
    if (!this.delivery) return;

    const ref = this.dialog.open(ScheduleRescheduleDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        id: this.delivery.id,
        fechaActual: this.delivery.fechaProgramada
      }
    });

    ref.afterClosed().subscribe(result => {
      if (result) {
        this.hasChanges = true;
        this.loadDetail(); // Reload to show updated state
        this.snackBar.open('Entrega reprogramada exitosamente', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // ── Cancel ─────────────────────────────

  openCancel(): void {
    if (!this.delivery) return;

    const ref = this.dialog.open(ScheduleCancelDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        id: this.delivery.id
      }
    });

    ref.afterClosed().subscribe(result => {
      if (result) {
        this.hasChanges = true;
        this.loadDetail(); // Reload to show cancelled state
        this.snackBar.open('Entrega cancelada', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // ── Close ──────────────────────────────

  closeDialog(): void {
    this.dialogRef.close(this.hasChanges);
  }
}
