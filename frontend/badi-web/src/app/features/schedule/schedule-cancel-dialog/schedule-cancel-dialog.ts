import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { ScheduleService } from '../schedule.service';

@Component({
  selector: 'app-schedule-cancel-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    IftaLabelModule,
    InputTextModule,
    TextareaModule,
    ButtonModule
  ],
  templateUrl: './schedule-cancel-dialog.html',
  styleUrls: ['./schedule-cancel-dialog.scss']
})
export class ScheduleCancelDialogComponent {
  form: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private scheduleService: ScheduleService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ScheduleCancelDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: string }
  ) {
    this.form = this.fb.group({
      motivoCancelacion: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading = true;
    const payload = {
      motivoCancelacion: this.form.value.motivoCancelacion.trim()
    };

    this.scheduleService.cancel(this.data.id, payload).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (err) => {
        const message = err.error?.message || 'Error al cancelar la entrega';
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
