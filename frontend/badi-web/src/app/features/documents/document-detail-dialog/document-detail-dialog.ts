import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DocumentsService, Document } from '../documents.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-document-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './document-detail-dialog.html',
  styleUrls: ['./document-detail-dialog.scss']
})
export class DocumentDetailDialogComponent {
  doc: Document;
  isEditMode = false;
  editForm: FormGroup;
  isSaving = false;

  constructor(
    private dialogRef: MatDialogRef<DocumentDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Document,
    private fb: FormBuilder,
    private documentsService: DocumentsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.doc = data;
    this.editForm = this.fb.group({
      titulo: [this.doc.titulo, [Validators.required, Validators.maxLength(300)]],
      descripcion: [this.doc.descripcion],
      fechaDocumento: [this.doc.fechaDocumento ? this.doc.fechaDocumento.substring(0, 10) : ''],
      observaciones: [this.doc.observaciones, this.doc.tipoDocumento.observacionesObligatorias ? [Validators.required] : []]
    });
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      // Reset form to current doc values
      this.editForm.patchValue({
        titulo: this.doc.titulo,
        descripcion: this.doc.descripcion,
        fechaDocumento: this.doc.fechaDocumento ? this.doc.fechaDocumento.substring(0, 10) : '',
        observaciones: this.doc.observaciones
      });
    }
  }

  saveMetadata() {
    if (this.editForm.invalid) return;
    this.isSaving = true;
    this.documentsService.update(this.doc.id, this.editForm.value).subscribe({
      next: (updatedDoc) => {
        this.doc = { ...this.doc, ...updatedDoc };
        this.isEditMode = false;
        this.isSaving = false;
        this.snackBar.open('Metadatos actualizados', 'Cerrar', { duration: 3000 });
      },
      error: () => {
        this.isSaving = false;
        this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 });
      }
    });
  }

  download() {
    window.open(this.documentsService.getDownloadUrl(this.doc.id), '_blank');
  }

  viewInline() {
    window.open(this.documentsService.getViewUrl(this.doc.id), '_blank');
  }

  annul() {
    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Anular Documento',
        message: '¿Está seguro de anular este documento? Esta acción no eliminará el archivo, pero dejará de mostrarse como documento activo.',
        confirmText: 'Anular documento',
        confirmColor: 'warn'
      }
    });

    confirmRef.afterClosed().subscribe(res => {
      if (res) {
        this.documentsService.annul(this.doc.id).subscribe(() => {
          this.snackBar.open('Documento anulado', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(true);
        });
      }
    });
  }

  formatBytes(bytes: number) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}
