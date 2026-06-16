import { Component, Inject } from '@angular/core';
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
    MatProgressSpinnerModule
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
    @Inject(MAT_DIALOG_DATA) public data: { id: string; fechaActual: string }
  ) {
    this.form = this.fb.group({
      nuevaFecha: [null, Validators.required],
      motivoReprogramacion: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  private formatDateForApi(dateValue: any): string {
    if (!dateValue) return '';
    if (typeof dateValue === 'string') {
      const match = dateValue.match(/^\d{4}-\d{2}-\d{2}/);
      if (match) return match[0];
    }
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading = true;
    const v = this.form.value;

    const payload = {
      nuevaFecha: this.formatDateForApi(v.nuevaFecha),
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
      }
    });
  }
}
