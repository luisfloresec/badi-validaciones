import { Component, Inject, OnInit } from '@angular/core';
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
import { TextareaModule } from 'primeng/textarea';
import { FluidModule } from 'primeng/fluid';
import { ButtonModule } from 'primeng/button';
import { AgreementsService, AgreementType } from '../agreements.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UppercaseDirective } from '../../../shared/directives/uppercase.directive';

@Component({
  selector: 'app-agreement-type-form-dialog',
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
    TextareaModule,
    FluidModule,
    ButtonModule,
    UppercaseDirective
  ],
  template: `
  <div class="dialog-container">
    <div class="dialog-header">
      <div class="header-title">
        <mat-icon>{{ isEdit ? 'edit' : 'category' }}</mat-icon>
        <h2 mat-dialog-title>{{ isEdit ? 'Editar Tipo de Convenio' : 'Registrar Tipo de Convenio' }}</h2>
      </div>
      <p-button icon="pi pi-times" [text]="true" severity="secondary" mat-dialog-close [disabled]="isLoading" />
    </div>

    <div class="dialog-content" mat-dialog-content>
      <div class="section-title mb-3">
        <h3 style="font-size: 15px; font-weight: 600; color: #374151; margin: 0 0 16px 0;">Datos del tipo de convenio</h3>
      </div>

      <form [formGroup]="form" class="badi-form p-fluid">
        <div class="form-row">
          <div class="field-container col-full">
            <p-iftalabel>
              <input pInputText formControlName="nombre" id="nombre" appUppercase />
              <label for="nombre">Nombre</label>
            </p-iftalabel>
            <small class="field-hint">Ejemplo: Convenio Piloto</small>
            <small class="field-error" *ngIf="form.get('nombre')?.hasError('required') && form.get('nombre')?.touched">El nombre es obligatorio.</small>
            <small class="field-error" *ngIf="form.get('nombre')?.hasError('maxlength') && form.get('nombre')?.touched">Máximo 120 caracteres.</small>
          </div>
        </div>

        <div class="form-row">
          <div class="field-container col-full">
            <p-iftalabel>
              <textarea pTextarea formControlName="descripcion" id="descripcion" rows="3" style="resize: vertical; width: 100%;" appUppercase></textarea>
              <label for="descripcion">Descripción (Opcional)</label>
            </p-iftalabel>
            <small class="field-hint">Describe brevemente la finalidad o modalidad del convenio</small>
          </div>
        </div>

        <div class="form-row">
          <div class="field-container col-half">
            <p-iftalabel>
              <input pInputText type="number" formControlName="duracionMeses" id="duracionMeses" min="1" />
              <label for="duracionMeses">Duración en meses (Opcional)</label>
            </p-iftalabel>
            <small class="field-hint">Ejemplo: 12 para convenios anuales</small>
            <small class="field-error" *ngIf="form.get('duracionMeses')?.hasError('min') && form.get('duracionMeses')?.touched">Debe ser mayor a 0.</small>
          </div>

          <div class="field-container col-half">
            <p-iftalabel>
              <input pInputText type="number" formControlName="maxRetiros" id="maxRetiros" min="1" />
              <label for="maxRetiros">Máximo de retiros (Opcional)</label>
            </p-iftalabel>
            <small class="field-hint">Ejemplo: 4 para convenios piloto</small>
            <small class="field-error" *ngIf="form.get('maxRetiros')?.hasError('min') && form.get('maxRetiros')?.touched">Debe ser mayor a 0.</small>
          </div>
        </div>

        <div class="info-banner mt-2" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px;">
          <p class="text-muted mb-0" style="font-size: 13px; margin: 0; color: #64748b;">
            Puede definir una duración en meses, un máximo de retiros o ambos, según la modalidad del convenio.
          </p>
        </div>
      </form>
    </div>

    <div class="dialog-actions" mat-dialog-actions>
      <p-button label="Cancelar" [outlined]="true" severity="secondary" mat-dialog-close [disabled]="isLoading" />
      <p-button [label]="isEdit ? 'Guardar cambios' : 'Registrar Tipo'"
                (onClick)="onSubmit()" 
                [disabled]="form.invalid || isLoading"
                [loading]="isLoading" />
    </div>
  </div>
  `,
  styleUrls: ['../agreement-form-dialog/agreement-form-dialog.scss']
})
export class AgreementTypeFormDialogComponent implements OnInit {
  form: FormGroup;
  isEdit = false;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private agreementsService: AgreementsService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<AgreementTypeFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { type?: AgreementType }
  ) {
    this.isEdit = !!data?.type;
    
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(120)]],
      descripcion: [''],
      duracionMeses: [null, [Validators.min(1)]],
      maxRetiros: [null, [Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    if (this.isEdit && this.data.type) {
      const t = this.data.type;
      this.form.patchValue({
        nombre: t.nombre,
        descripcion: t.descripcion,
        duracionMeses: t.duracionMeses,
        maxRetiros: t.maxRetiros
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.isLoading = true;
    const v = this.form.value;

    const payload = {
      nombre: v.nombre,
      descripcion: v.descripcion || undefined,
      duracionMeses: v.duracionMeses || undefined,
      maxRetiros: v.maxRetiros || undefined
    };

    const request = this.isEdit 
      ? this.agreementsService.updateType(this.data.type!.id, payload)
      : this.agreementsService.createType(payload);

    request.subscribe({
      next: () => {
        this.snackBar.open(`Tipo de convenio ${this.isEdit ? 'actualizado' : 'registrado'} con éxito`, 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Error al guardar el tipo de convenio', 'Cerrar', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }
}
