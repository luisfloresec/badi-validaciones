import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ScheduleService } from '../schedule.service';
import { AgreementsService, Agreement } from '../../agreements/agreements.service';

@Component({
  selector: 'app-schedule-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './schedule-form-dialog.html',
  styleUrls: ['./schedule-form-dialog.scss']
})
export class ScheduleFormDialogComponent implements OnInit {
  form: FormGroup;
  isLoading = false;
  agreements: Agreement[] = [];
  agreementsLoading = true;
  selectedAgreement: Agreement | null = null;
  agreementLocked = false;

  constructor(
    private fb: FormBuilder,
    private scheduleService: ScheduleService,
    private agreementsService: AgreementsService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ScheduleFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { fecha: Date; agreementId?: string }
  ) {
    this.agreementLocked = !!data.agreementId;
    this.form = this.fb.group({
      agreementId: [data.agreementId || '', Validators.required],
      fechaProgramada: [data.fecha || new Date(), Validators.required],
      descripcion: ['', Validators.maxLength(300)],
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    this.loadAgreements();
  }

  loadAgreements(): void {
    this.agreementsLoading = true;
    this.agreementsService.getAll().subscribe({
      next: (agreements) => {
        // Filtrar solo convenios activos
        this.agreements = agreements.filter(a => a.estado === 'Activo');
        this.agreementsLoading = false;
        // Pre-select agreement if locked
        if (this.data.agreementId) {
          this.selectedAgreement = this.agreements.find(a => a.id === this.data.agreementId) || null;
        }
      },
      error: () => {
        this.snackBar.open('Error al cargar convenios', 'Cerrar', { duration: 3000 });
        this.agreementsLoading = false;
      }
    });
  }

  onAgreementChange(): void {
    const selectedId = this.form.get('agreementId')?.value;
    this.selectedAgreement = this.agreements.find(a => a.id === selectedId) || null;
  }

  getAgreementLabel(agreement: Agreement): string {
    const code = agreement.codigoConvenio || 'S/C';
    const org = agreement.organizacion?.razonSocial || agreement.organizacion?.nombreComercial || 'Organización';
    return `${code} — ${org}`;
  }

  get descripcionLength(): number {
    return this.form.get('descripcion')?.value?.length || 0;
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
      agreementId: v.agreementId,
      fechaProgramada: this.formatDateForApi(v.fechaProgramada),
      descripcion: v.descripcion?.trim() || undefined,
      observaciones: v.observaciones?.trim() || undefined
    };

    this.scheduleService.create(payload).subscribe({
      next: () => {
        this.snackBar.open('Entrega programada exitosamente', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        const message = err.error?.message || 'Error al programar la entrega';
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
