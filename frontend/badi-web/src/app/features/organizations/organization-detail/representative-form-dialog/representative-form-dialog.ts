import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InputTextModule } from 'primeng/inputtext';
import { IftaLabelModule } from 'primeng/iftalabel';
import { FluidModule } from 'primeng/fluid';
import { ButtonModule } from 'primeng/button';
import { OrganizationsService } from '../../organizations.service';

export interface RepresentativeDialogData {
  organizationId: string;
  mode: 'create' | 'edit' | 'replace';
  representativeData?: any;
}

@Component({
  selector: 'app-representative-form-dialog',
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
    InputTextModule,
    IftaLabelModule,
    FluidModule,
    ButtonModule
  ],
  templateUrl: './representative-form-dialog.html',
  styleUrls: ['./representative-form-dialog.scss']
})
export class RepresentativeFormDialogComponent implements OnInit {
  form: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RepresentativeFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RepresentativeDialogData,
    private orgService: OrganizationsService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      nombres: ['', [Validators.required, Validators.maxLength(100)]],
      apellidos: ['', [Validators.required, Validators.maxLength(100)]],
      cedula: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      telefono: ['', [Validators.maxLength(20)]],
      email: ['', [Validators.email, Validators.maxLength(120)]]
    });
  }

  ngOnInit(): void {
    if (this.data.mode === 'edit' && this.data.representativeData) {
      const rep = this.data.representativeData;
      this.form.patchValue({
        nombres: rep.nombres,
        apellidos: rep.apellidos,
        cedula: rep.cedula,
        telefono: rep.telefono,
        email: rep.email
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    let payload = this.form.value;

    // Normalizar email a null si está vacío para evitar problemas
    if (payload.email === '') {
      payload.email = null;
    }

    if (this.data.mode === 'edit') {
      const repId = this.data.representativeData.id;
      this.orgService.updateRepresentative(repId, payload).subscribe({
        next: (res) => {
          this.loading = false;
          this.cdr.detectChanges();
          this.dialogRef.close(res);
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || 'Ocurrió un error al editar el representante.';
          this.cdr.detectChanges();
        }
      });
    } else if (this.data.mode === 'replace') {
      this.orgService.replaceRepresentative(this.data.organizationId, payload).subscribe({
        next: (res) => {
          this.loading = false;
          this.cdr.detectChanges();
          this.dialogRef.close(res);
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || 'Ocurrió un error al reemplazar el representante.';
          this.cdr.detectChanges();
        }
      });
    } else {
      // create mode (primer representante)
      // Necesita enviar organizationId
      payload.organizationId = this.data.organizationId;
      payload.esPrincipal = true;
      
      this.orgService['http'].post('http://localhost:3000/representatives', payload).subscribe({
        next: (res) => {
          this.loading = false;
          this.cdr.detectChanges();
          this.dialogRef.close(res);
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || 'Ocurrió un error al guardar el representante.';
          this.cdr.detectChanges();
        }
      });
    }
  }
}
