import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ButtonModule } from 'primeng/button';
import { DocumentsService, Document } from '../documents.service';
import { DocumentTypesService, DocumentType } from '../document-types.service';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface DeliveryEvidenceUploadData {
  entidadRelacionada: string;
  idEntidadRelacionada: string;
  entityName?: string;
  origin?: string;
}

interface SelectedImage {
  file: File;
  previewUrl: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
}

@Component({
  selector: 'app-delivery-evidence-upload-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, ButtonModule],
  templateUrl: './delivery-evidence-upload-dialog.html',
  styleUrls: ['./delivery-evidence-upload-dialog.scss']
})
export class DeliveryEvidenceUploadDialogComponent implements OnInit {
  selectedImages: SelectedImage[] = [];
  isUploading = false;
  uploadProgress = 0;
  totalToUpload = 0;
  evidenceDocumentTypeId: string | null = null;
  
  // Allowed image extensions
  allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
  
  constructor(
    private dialogRef: MatDialogRef<DeliveryEvidenceUploadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeliveryEvidenceUploadData,
    private documentsService: DocumentsService,
    private documentTypesService: DocumentTypesService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Find the document type ID for 'Fotografías para entregas' or 'Registro fotográfico'
    this.documentTypesService.getAllActive().subscribe(types => {
      const type = types.find(t => 
        t.nombre.toLowerCase().includes('fotografía') || 
        t.nombre.toLowerCase().includes('fotografico') || 
        t.nombre.toLowerCase().includes('fotográfico')
      );
      if (type) {
        this.evidenceDocumentTypeId = type.id;
      } else {
        // Fallback to 'Otro' if not found
        const fallback = types.find(t => t.nombre.toLowerCase() === 'otro');
        if (fallback) {
          this.evidenceDocumentTypeId = fallback.id;
        } else if (types.length > 0) {
          this.evidenceDocumentTypeId = types[0].id; // ultimate fallback
        }
      }
    });
  }

  onFileSelected(event: any) {
    this.handleFiles(event.target.files);
    event.target.value = ''; // Reset input
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.files) {
      this.handleFiles(event.dataTransfer.files);
    }
  }

  handleFiles(files: FileList | File[]) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      
      if (!this.allowedExts.includes(ext) || !file.type.startsWith('image/')) {
        this.snackBar.open(`El archivo "${file.name}" no es una imagen permitida. Solo imágenes (jpg, png, webp).`, 'Cerrar', { duration: 4000 });
        continue;
      }
      
      const objectUrl = URL.createObjectURL(file);
      this.selectedImages.push({
        file,
        previewUrl: objectUrl,
        status: 'pending'
      });
    }
    this.cdr.detectChanges();
  }

  removeImage(index: number) {
    if (this.isUploading) return;
    const img = this.selectedImages[index];
    URL.revokeObjectURL(img.previewUrl);
    this.selectedImages.splice(index, 1);
  }

  async onSubmit() {
    if (this.selectedImages.length === 0) {
      this.snackBar.open('Debe seleccionar al menos una imagen', 'Cerrar', { duration: 3000 });
      return;
    }

    if (!this.evidenceDocumentTypeId) {
      this.snackBar.open('No se pudo determinar el tipo de documento. Contacte soporte.', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isUploading = true;
    this.totalToUpload = this.selectedImages.length;
    this.uploadProgress = 0;
    this.cdr.detectChanges();

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const fechaDocumento = `${y}-${m}-${d}`;

    let successCount = 0;
    let errorCount = 0;

    // Loop and upload sequentially
    for (const image of this.selectedImages) {
      if (image.status === 'success') continue; // Skip already uploaded if retrying

      image.status = 'uploading';
      this.cdr.detectChanges();

      const payload = {
        tipoDocumentoId: this.evidenceDocumentTypeId,
        titulo: image.file.name,
        origenCarga: 'ENTREGA_REALIZADA',
        entidadRelacionada: 'ENTREGA_REALIZADA',
        idEntidadRelacionada: this.data.idEntidadRelacionada,
        fechaDocumento: fechaDocumento
      };

      try {
        await this.uploadSingle(payload, image.file);
        image.status = 'success';
        successCount++;
      } catch (err) {
        image.status = 'error';
        errorCount++;
      }
      
      this.uploadProgress++;
      this.cdr.detectChanges();
    }

    this.isUploading = false;
    this.cdr.detectChanges();

    if (errorCount === 0) {
      this.snackBar.open('Evidencias cargadas correctamente.', 'Cerrar', { duration: 4000 });
      setTimeout(() => {
        this.dialogRef.close(true); // close and signal success
      }, 0);
    } else {
      this.snackBar.open(`Se cargaron ${successCount} imágenes, pero fallaron ${errorCount}. Por favor revisa e intenta de nuevo.`, 'Cerrar', { duration: 6000 });
    }
  }

  private uploadSingle(payload: any, file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      this.documentsService.upload(payload, file).subscribe({
        next: (res) => resolve(res),
        error: (err) => reject(err)
      });
    });
  }
}
