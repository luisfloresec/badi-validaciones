import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { AgreementsService, AgreementType } from '../agreements.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    MatIconModule
  ],
  template: `
  <div class="dialog-container">
    <div class="dialog-header">
      <div class="header-title">
        <mat-icon>{{ isEdit ? 'edit' : 'add_circle' }}</mat-icon>
        <h2>{{ isEdit ? 'Editar Tipo de Convenio' : 'Nuevo Tipo de Convenio' }}</h2>
      </div>
      <button mat-icon-button mat-dialog-close class="close-button">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <div class="dialog-content" mat-dialog-content>
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="badi-form">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre">
          <mat-hint>Ejemplo: Convenio Mixto</mat-hint>
          <mat-error *ngIf="form.get('nombre')?.hasError('required')">El nombre es obligatorio.</mat-error>
          <mat-error *ngIf="form.get('nombre')?.hasError('maxlength')">Máximo 120 caracteres.</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Descripción (Opcional)</mat-label>
          <textarea matInput formControlName="descripcion" rows="3"></textarea>
          <mat-hint>Ejemplo: Convenio controlado por tiempo y retiros</mat-hint>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline" class="w-100">
            <mat-label>Duración en meses (Opcional)</mat-label>
            <input matInput type="number" formControlName="duracionMeses" min="1">
            <mat-hint>Si está vacío, no se controlará por tiempo.</mat-hint>
            <mat-error *ngIf="form.get('duracionMeses')?.hasError('min')">Debe ser mayor a 0.</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-100">
            <mat-label>Máximo de retiros (Opcional)</mat-label>
            <input matInput type="number" formControlName="maxRetiros" min="1">
            <mat-hint>Si está vacío, no se controlará por retiros.</mat-hint>
            <mat-error *ngIf="form.get('maxRetiros')?.hasError('min')">Debe ser mayor a 0.</mat-error>
          </mat-form-field>
        </div>
        <p class="text-muted" style="font-size: 13px; margin-top: 8px;">
          * Si ambos controles están vacíos, la finalización del convenio será de control manual.
        </p>
      </form>
    </div>

    <div class="dialog-actions" mat-dialog-actions>
      <button mat-stroked-button mat-dialog-close [disabled]="isLoading">Cancelar</button>
      <button mat-flat-button color="primary" (click)="onSubmit()" [disabled]="form.invalid || isLoading" class="btn-primary">
        <mat-icon>save</mat-icon> {{ isEdit ? 'Guardar Cambios' : 'Registrar Tipo' }}
      </button>
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
