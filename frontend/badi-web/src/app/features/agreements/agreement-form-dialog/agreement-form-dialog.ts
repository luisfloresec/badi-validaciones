import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AgreementsService, AgreementType } from '../agreements.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrganizationsService } from '../../organizations/organizations.service';

@Component({
  selector: 'app-agreement-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './agreement-form-dialog.html',
  styleUrls: ['./agreement-form-dialog.scss']
})
export class AgreementFormDialogComponent implements OnInit {
  form: FormGroup;
  isEdit = false;
  isLoading = false;
  types: AgreementType[] = [];
  organizations: any[] = [];
  
  constructor(
    private fb: FormBuilder,
    private agreementsService: AgreementsService,
    private organizationService: OrganizationsService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<AgreementFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      organizationId?: string, 
      agreement?: any,
      disableOrgSelect?: boolean 
    }
  ) {
    this.isEdit = !!data.agreement;
    this.form = this.fb.group({
      organizationId: [{ value: data.organizationId || '', disabled: data.disableOrgSelect || this.isEdit }, Validators.required],
      tipoConvenioId: ['', Validators.required],
      codigoConvenio: ['', [Validators.required, Validators.maxLength(50), Validators.pattern('.*\\S+.*')]],
      fechaInicio: [''],
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    this.loadTypes();
    if (!this.data.organizationId && !this.isEdit) {
      this.loadOrganizations();
    }
    
    if (this.isEdit) {
      const a = this.data.agreement;
      this.form.patchValue({
        organizationId: a.organizacion?.id || this.data.organizationId,
        tipoConvenioId: a.tipoConvenio?.id || a.tipoConvenio,
        codigoConvenio: a.codigoConvenio,
        fechaInicio: a.fechaInicio ? this.parseDateString(a.fechaInicio) : '',
        observaciones: a.observaciones
      });
    }
  }

  private parseDateString(dateValue: any): Date | string {
    if (!dateValue) return '';
    if (typeof dateValue === 'string') {
      const parts = dateValue.split('T')[0].split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }
    return new Date(dateValue);
  }

  private formatDateForApi(dateValue: any): string | undefined {
    if (!dateValue) return undefined;
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return undefined;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadTypes() {
    this.agreementsService.getTypes().subscribe({
      next: (res) => this.types = res,
      error: () => this.snackBar.open('Error al cargar tipos de convenio', 'Cerrar', { duration: 3000 })
    });
  }

  loadOrganizations() {
    // Si estuviéramos en la pantalla general, cargamos la lista (asumiendo que existe getAll)
    this.organizationService.getAll().subscribe({
      next: (res: any) => this.organizations = res.filter((o: any) => o.estado !== 'Inactiva'),
      error: () => {}
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.isLoading = true;
    const v = this.form.getRawValue(); // gets disabled fields too
    const payload: any = {
      tipoConvenioId: v.tipoConvenioId,
      codigoConvenio: v.codigoConvenio?.trim() || undefined,
      fechaInicio: this.formatDateForApi(v.fechaInicio),
      observaciones: v.observaciones || undefined
    };

    if (!this.isEdit) {
      payload.organizationId = v.organizationId;
    }

    const request = this.isEdit 
      ? this.agreementsService.update(this.data.agreement.id, payload)
      : this.agreementsService.create(payload);

    request.subscribe({
      next: (res) => {
        this.snackBar.open(`Convenio ${this.isEdit ? 'actualizado' : 'registrado'} con éxito`, 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Error al guardar el convenio', 'Cerrar', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }
}
