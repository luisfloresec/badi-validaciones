import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TextareaModule } from 'primeng/textarea';
import { IftaLabelModule } from 'primeng/iftalabel';
import { ButtonModule } from 'primeng/button';
import { DocumentsService, Document } from '../documents.service';

@Component({
  selector: 'app-document-replace-dialog',
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
    TextareaModule,
    IftaLabelModule,
    ButtonModule
  ],
  templateUrl: './document-replace-dialog.html',
  styleUrls: ['./document-replace-dialog.scss']
})
export class DocumentReplaceDialogComponent {
  replaceForm: FormGroup;
  selectedFile: File | null = null;
  doc: Document;
  isUploading = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DocumentReplaceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Document,
    private documentsService: DocumentsService,
    private snackBar: MatSnackBar
  ) {
    this.doc = data;
    this.replaceForm = this.fb.group({
      motivoReemplazo: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!this.doc.tipoDocumento.extensionesPermitidas.includes(ext)) {
        this.snackBar.open(`Extensión .${ext} no permitida para este tipo de documento.`, 'Cerrar', { duration: 3000 });
        this.selectedFile = null;
        event.target.value = '';
        return;
      }
      
      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > this.doc.tipoDocumento.tamanoMaximoMb) {
        this.snackBar.open(`El archivo excede los ${this.doc.tipoDocumento.tamanoMaximoMb}MB permitidos.`, 'Cerrar', { duration: 3000 });
        this.selectedFile = null;
        event.target.value = '';
        return;
      }
      this.selectedFile = file;
    }
  }

  onSubmit() {
    if (this.replaceForm.invalid || !this.selectedFile) {
      this.replaceForm.markAllAsTouched();
      return;
    }

    this.isUploading = true;
    const motivo = this.replaceForm.get('motivoReemplazo')?.value;

    this.documentsService.replace(this.doc.id, motivo, this.selectedFile).subscribe({
      next: (newDoc) => {
        this.snackBar.open('Documento reemplazado con éxito', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(newDoc);
      },
      error: (err) => {
        this.isUploading = false;
        this.snackBar.open(err.error?.message || 'Error al reemplazar documento', 'Cerrar', { duration: 4000 });
      }
    });
  }
}
