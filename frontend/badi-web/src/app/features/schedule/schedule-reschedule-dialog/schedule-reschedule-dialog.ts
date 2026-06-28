import { Component, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { ScheduleService } from '../schedule.service';

@Component({
  selector: 'app-schedule-reschedule-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    IftaLabelModule,
    InputTextModule,
    TextareaModule,
    ButtonModule
  ],
  templateUrl: './schedule-reschedule-dialog.html',
  styleUrls: ['./schedule-reschedule-dialog.scss']
})
export class ScheduleRescheduleDialogComponent {
  form: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private scheduleService: ScheduleService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ScheduleRescheduleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: string; fechaActual: string },
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      nuevaFecha: [null, Validators.required],
      motivoReprogramacion: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  formatDisplayDate(date: Date | string | null): string {
    if (!date) return 'Seleccione una fecha';

    let value = date;
    if (typeof date === 'string') {
      const parts = date.split('T')[0].split('-');
      value = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    if (isNaN((value as Date).getTime())) return 'Seleccione una fecha';

    return new Intl.DateTimeFormat('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(value as Date);
  }

  private formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private normalizeDateForPayload(value: Date | string | null): string {
    if (!value) return '';

    if (typeof value === 'string') {
      return value.slice(0, 10);
    }

    return this.formatLocalDate(value);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading = true;
    const v = this.form.value;

    const payload = {
      nuevaFecha: this.normalizeDateForPayload(v.nuevaFecha),
      motivoReprogramacion: v.motivoReprogramacion.trim()
    };

    this.scheduleService.reschedule(this.data.id, payload).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (err) => {
        const message = err.error?.message || 'Error al reprogramar la entrega';
        this.snackBar.open(
          Array.isArray(message) ? message.join('. ') : message,
          'Cerrar',
          { duration: 5000 }
        );
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
