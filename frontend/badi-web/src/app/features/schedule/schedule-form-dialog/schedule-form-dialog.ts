import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
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
    MatProgressSpinnerModule,
    IftaLabelModule,
    InputTextModule,
    TextareaModule,
    ButtonModule
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
    @Inject(MAT_DIALOG_DATA) public data: { fecha: Date; agreementId?: string },
    private cdr: ChangeDetectorRef
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
        this.cdr.detectChanges();
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
    return `${org} — Convenio ${code}`;
  }

  get descripcionLength(): number {
    return this.form.get('descripcion')?.value?.length || 0;
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
      agreementId: v.agreementId,
      fechaProgramada: this.normalizeDateForPayload(v.fechaProgramada),
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
        this.cdr.detectChanges();
      }
    });
  }
}
