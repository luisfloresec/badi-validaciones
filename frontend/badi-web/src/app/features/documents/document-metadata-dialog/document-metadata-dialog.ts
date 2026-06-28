import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { IftaLabelModule } from 'primeng/iftalabel';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DocumentsService, Document } from '../documents.service';
import { DocumentTypesService, DocumentType } from '../document-types.service';

@Component({
  selector: 'app-document-metadata-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
    IftaLabelModule,
    ButtonModule,
    DatePickerModule
  ],
  templateUrl: './document-metadata-dialog.html',
  styleUrls: ['./document-metadata-dialog.scss']
})
export class DocumentMetadataDialogComponent implements OnInit {
  doc: Document;
  editForm: FormGroup;
  isSaving = false;

  documentTypes: DocumentType[] = [];
  selectedType: DocumentType | null = null;

  constructor(
    private dialogRef: MatDialogRef<DocumentMetadataDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Document,
    private fb: FormBuilder,
    private documentsService: DocumentsService,
    private documentTypesService: DocumentTypesService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.doc = data;
    this.editForm = this.fb.group({
      titulo: [this.doc.titulo, [Validators.required, Validators.maxLength(300)]],
      tipoDocumentoId: [this.doc.tipoDocumento?.id, Validators.required],
      descripcion: [this.doc.descripcion],
      fechaDocumento: [this.doc.fechaDocumento ? this.parseDateForForm(this.doc.fechaDocumento) : '', Validators.required],
      observaciones: [this.doc.observaciones, this.doc.tipoDocumento?.observacionesObligatorias ? [Validators.required] : []]
    });
  }

  ngOnInit(): void {
    this.documentTypesService.getAllActive().subscribe(types => {
      const currentEntity = this.doc.entidadRelacionada || 'GENERAL';
      if (currentEntity === 'GENERAL') {
        this.documentTypes = types.filter(t => t.permiteCargaGeneral && t.nombre !== 'Registro fotográfico');
      } else if (currentEntity === 'ENTREGA_REALIZADA') {
        this.documentTypes = types.filter(t => t.nombre === 'Registro fotográfico' || t.nombre === 'Otro');
      } else {
        this.documentTypes = types.filter(t => t.entidadesPermitidas.includes(currentEntity));
      }
      
      if (!this.documentTypes.some(t => t.id === this.doc.tipoDocumento?.id) && this.doc.tipoDocumento) {
        this.documentTypes.push(this.doc.tipoDocumento);
      }
      this.cdr.detectChanges();
    });

    this.editForm.get('tipoDocumentoId')?.valueChanges.subscribe(id => {
      this.selectedType = this.documentTypes.find(t => t.id === id) || null;
      if (this.selectedType?.observacionesObligatorias) {
        this.editForm.get('observaciones')?.setValidators([Validators.required]);
      } else {
        this.editForm.get('observaciones')?.clearValidators();
      }
      this.editForm.get('observaciones')?.updateValueAndValidity();
      this.cdr.detectChanges();
    });
  }

  private parseDateForForm(dateValue: any): Date | string {
    if (!dateValue) return '';
    if (typeof dateValue === 'string') {
      const parts = dateValue.split('T')[0].split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }
    return new Date(dateValue);
  }

  formatDisplayDate(date: Date | string | null): string {
    if (!date) return 'Seleccione una fecha (Obligatorio)';

    const value = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    if (isNaN(value.getTime())) return 'Seleccione una fecha (Obligatorio)';

    return new Intl.DateTimeFormat('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(value);
  }

  saveMetadata() {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.snackBar.open('Por favor, complete todos los campos obligatorios indicados en rojo antes de guardar.', 'Cerrar', { duration: 4000 });
      return;
    }
    this.isSaving = true;
    this.cdr.detectChanges();

    const formValue = this.editForm.value;
    const payload: any = { ...formValue };

    if (formValue.fechaDocumento) {
      const raw = formValue.fechaDocumento;
      if (raw instanceof Date) {
        const y = raw.getFullYear();
        const m = String(raw.getMonth() + 1).padStart(2, '0');
        const d = String(raw.getDate()).padStart(2, '0');
        payload.fechaDocumento = `${y}-${m}-${d}`;
      } else if (typeof raw === 'string' && raw.length > 0) {
        payload.fechaDocumento = raw.substring(0, 10);
      }
    }

    this.documentsService.update(this.doc.id, payload).subscribe({
      next: (updatedDoc) => {
        this.isSaving = false;
        this.snackBar.open('Metadatos actualizados exitosamente', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(updatedDoc);
      },
      error: () => {
        this.isSaving = false;
        this.snackBar.open('Error al actualizar metadatos', 'Cerrar', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }
}
