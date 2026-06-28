import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { IftaLabelModule } from 'primeng/iftalabel';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DocumentTypesService, DocumentType, CreateDocumentTypeDto } from '../document-types.service';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

const ENTIDADES = ['ORGANIZACION', 'CONVENIO', 'ENTREGA_REALIZADA', 'GENERAL'];
const EXTENSIONES_COMUNES = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp', 'xls', 'xlsx'];

@Component({
  selector: 'app-document-type-form-dialog',
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
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    InputTextModule,
    TextareaModule,
    IftaLabelModule,
    ButtonModule,
    ToggleSwitchModule
  ],
  templateUrl: './document-type-form-dialog.html',
  styleUrls: ['./document-type-form-dialog.scss']
})
export class DocumentTypeFormDialogComponent implements OnInit {
  form: FormGroup;
  isSaving = false;
  isEdit: boolean;
  type?: DocumentType;

  readonly ENTIDADES = ENTIDADES;
  readonly EXTENSIONES_COMUNES = EXTENSIONES_COMUNES;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  extensiones: string[] = [];
  entidades: string[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DocumentTypeFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { type?: DocumentType },
    private documentTypesService: DocumentTypesService,
    private snackBar: MatSnackBar
  ) {
    this.isEdit = !!data?.type;
    this.type = data?.type;

    this.form = this.fb.group({
      nombre: [this.type?.nombre || '', [Validators.required, Validators.maxLength(120)]],
      codigo: [{ value: this.type?.codigo || '', disabled: this.isEdit }, [Validators.required, Validators.maxLength(60), Validators.pattern(/^[a-z0-9-]+$/)]],
      descripcion: [this.type?.descripcion || ''],
      tamanoMaximoMb: [this.type?.tamanoMaximoMb ?? 10, [Validators.required, Validators.min(1), Validators.max(50)]],
      requiereEntidadRelacionada: [this.type?.requiereEntidadRelacionada ?? false],
      permiteCargaGeneral: [this.type?.permiteCargaGeneral ?? true],
      requiereFechaDocumento: [this.type?.requiereFechaDocumento ?? false],
      observacionesObligatorias: [this.type?.observacionesObligatorias ?? false]
    });

    this.extensiones = [...(this.type?.extensionesPermitidas || ['pdf'])];
    this.entidades = [...(this.type?.entidadesPermitidas || [])];
  }

  ngOnInit(): void {}

  addExtension(event: MatChipInputEvent) {
    const value = (event.value || '').trim().toLowerCase().replace(/^\./, '');
    if (value && !this.extensiones.includes(value)) {
      this.extensiones.push(value);
    }
    event.chipInput?.clear();
  }

  removeExtension(ext: string) {
    this.extensiones = this.extensiones.filter(e => e !== ext);
  }

  toggleExtension(ext: string) {
    if (this.extensiones.includes(ext)) {
      this.removeExtension(ext);
    } else {
      this.extensiones.push(ext);
    }
  }

  toggleEntidad(entidad: string) {
    if (this.entidades.includes(entidad)) {
      this.entidades = this.entidades.filter(e => e !== entidad);
    } else {
      this.entidades.push(entidad);
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Corrige los errores del formulario', 'Cerrar', { duration: 3000 });
      return;
    }

    if (this.extensiones.length === 0) {
      this.snackBar.open('Debes agregar al menos una extensión permitida', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isSaving = true;
    const payload: CreateDocumentTypeDto = {
      ...this.form.getRawValue(),
      extensionesPermitidas: this.extensiones,
      entidadesPermitidas: this.entidades
    };

    const op$ = this.isEdit
      ? this.documentTypesService.update(this.type!.id, payload)
      : this.documentTypesService.create(payload);

    op$.subscribe({
      next: (result) => {
        this.isSaving = false;
        const msg = this.isEdit ? 'Tipo actualizado correctamente' : 'Tipo creado correctamente';
        this.snackBar.open(msg, 'Cerrar', { duration: 3000 });
        this.dialogRef.close(result);
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err.error?.message || (this.isEdit ? 'Error al actualizar' : 'Error al crear');
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      }
    });
  }
}
