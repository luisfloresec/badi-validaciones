import { Component, Inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { IftaLabelModule } from 'primeng/iftalabel';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DocumentsService, Document } from '../documents.service';
import { DocumentTypesService, DocumentType } from '../document-types.service';
import { DocumentReplaceDialogComponent } from '../document-replace-dialog/document-replace-dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { AuthService } from '../../../core/auth/auth.service';

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
  templateUrl: './document-detail-dialog.html',
  styleUrls: ['./document-detail-dialog.scss']
})
export class DocumentDetailDialogComponent implements OnInit, OnDestroy {
  doc: Document;
  isEditMode = false;
  editForm: FormGroup;
  isSaving = false;

  documentTypes: DocumentType[] = [];
  selectedType: DocumentType | null = null;

  imageBlobUrl: SafeUrl | null = null;
  isLoadingImage = false;
  private rawBlobUrl: string | null = null;
  private subs: Subscription[] = [];

  constructor(
    private dialogRef: MatDialogRef<DocumentDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Document,
    private fb: FormBuilder,
    private documentsService: DocumentsService,
    private documentTypesService: DocumentTypesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {
    this.doc = data;
    this.editForm = this.fb.group({
      titulo: [this.doc.titulo, [Validators.required, Validators.maxLength(300)]],
      tipoDocumentoId: [this.doc.tipoDocumento?.id, Validators.required],
      descripcion: [this.doc.descripcion],
      observaciones: [this.doc.observaciones]
    });
  }

  ngOnInit(): void {
    if (this.isImage(this.doc)) {
      this.loadImageBlob();
    }

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
      this.editForm.get('observaciones')?.clearValidators();
      this.editForm.get('observaciones')?.updateValueAndValidity();
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if (this.rawBlobUrl) {
      URL.revokeObjectURL(this.rawBlobUrl);
    }
    this.subs.forEach(s => s.unsubscribe());
  }

  isImage(doc: Document): boolean {
    const imgExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const ext = doc.extension?.toLowerCase().replace('.', '') || '';
    return imgExts.includes(ext);
  }

  getFileIcon(doc: Document): string {
    const ext = doc.extension?.toLowerCase().replace('.', '') || '';
    if (['pdf'].includes(ext)) return 'picture_as_pdf';
    if (['doc', 'docx'].includes(ext)) return 'description';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'table_chart';
    if (['ppt', 'pptx'].includes(ext)) return 'slideshow';
    if (['zip', 'rar', '7z'].includes(ext)) return 'folder_zip';
    return 'insert_drive_file';
  }

  getEntidadLabel(doc: Document): string {
    if (doc.entityName && doc.entityName !== 'Repositorio Global') {
      return `${doc.entityName} (${doc.entidadRelacionada})`;
    }
    if (doc.entidadRelacionada && doc.entidadRelacionada !== 'GENERAL') {
      return `${doc.entidadRelacionada}`;
    }
    return 'Repositorio Global (General)';
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

  private loadImageBlob(): void {
    const token = this.authService.getToken();
    if (!token) return;

    this.isLoadingImage = true;
    const url = this.documentsService.getViewUrl(this.doc.id);
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    const sub = this.http.get(url, { headers, responseType: 'blob' }).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.rawBlobUrl = objectUrl;
        this.imageBlobUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        this.isLoadingImage = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingImage = false;
        this.cdr.detectChanges();
      }
    });
    this.subs.push(sub);
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      this.editForm.patchValue({
        titulo: this.doc.titulo,
        tipoDocumentoId: this.doc.tipoDocumento?.id,
        descripcion: this.doc.descripcion,
        fechaDocumento: this.doc.fechaDocumento ? this.parseDateForForm(this.doc.fechaDocumento) : '',
        observaciones: this.doc.observaciones
      });
    }
    this.cdr.detectChanges();
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

    this.documentsService.update(this.doc.id, payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.snackBar.open('Metadatos actualizados exitosamente', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: () => {
        this.isSaving = false;
        this.snackBar.open('Error al actualizar metadatos', 'Cerrar', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  openReplaceDialog() {
    const replaceRef = this.dialog.open(DocumentReplaceDialogComponent, {
      width: '550px',
      disableClose: true,
      data: this.doc
    });

    replaceRef.afterClosed().subscribe(res => {
      if (res) {
        this.dialogRef.close(true);
      }
    });
  }

  download() {
    const token = this.authService.getToken();
    if (!token) return;

    const url = this.documentsService.getDownloadUrl(this.doc.id);
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get(url, { headers, responseType: 'blob' }).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const a = globalThis.document.createElement('a');
        a.href = objectUrl;
        a.download = this.doc.nombreOriginal || `${this.doc.titulo}.${this.doc.extension}`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
      },
      error: () => {
        this.snackBar.open('Error al descargar el archivo', 'Cerrar', { duration: 3000 });
      }
    });
  }

  viewInline() {
    const token = this.authService.getToken();
    if (!token) return;

    if (this.rawBlobUrl) {
      window.open(this.rawBlobUrl, '_blank');
      return;
    }

    const url = this.documentsService.getViewUrl(this.doc.id);
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get(url, { headers, responseType: 'blob' }).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
      },
      error: () => {
        this.snackBar.open('No se pudo abrir el documento', 'Cerrar', { duration: 3000 });
      }
    });
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
          this.snackBar.open('Documento anulado con éxito', 'Cerrar', { duration: 3000 });
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
