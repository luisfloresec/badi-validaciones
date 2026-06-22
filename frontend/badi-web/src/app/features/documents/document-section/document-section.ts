import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';
import { DocumentsService, Document } from '../documents.service';
import { DocumentUploadDialogComponent } from '../document-upload-dialog/document-upload-dialog';

@Component({
  selector: 'app-document-section',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './document-section.html',
  styleUrls: ['./document-section.scss']
})
export class DocumentSectionComponent implements OnInit {
  @Input() entityType!: 'ORGANIZACION' | 'CONVENIO' | 'ENTREGA_REALIZADA';
  @Input() entityId!: string;
  @Input() entityName?: string;
  @Input() allowedDocumentTypes?: string[];
  @Input() readonly?: boolean;

  documents: Document[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private documentsService: DocumentsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.entityType || !this.entityId) {
      console.error('DocumentSectionComponent requires entityType and entityId');
      this.error = 'Faltan parámetros requeridos';
      this.loading = false;
      return;
    }
    this.loadDocuments();
  }

  loadDocuments() {
    this.loading = true;
    this.error = null;
    
    // We reuse getAll but passing the entity context
    this.documentsService.getAll({
      entidadRelacionada: this.entityType,
      idEntidadRelacionada: this.entityId,
      estado: 'Activo', // We probably only want active documents in the section view
      limit: 50 // Fetch all relevant for the entity up to a limit
    })
    .pipe(finalize(() => {
      this.loading = false;
      this.cdr.detectChanges();
    }))
    .subscribe({
      next: (res) => {
        this.documents = res.data;
      },
      error: (err) => {
        this.error = 'Error al cargar documentos asociados';
        this.snackBar.open('Error al cargar documentos asociados', 'Cerrar', { duration: 3000 });
      }
    });
  }

  openUploadDialog() {
    if (this.readonly) return;

    const dialogRef = this.dialog.open(DocumentUploadDialogComponent, {
      width: '650px',
      disableClose: true,
      data: {
        entidadRelacionada: this.entityType,
        idEntidadRelacionada: this.entityId,
        entityName: this.entityName,
        origin: this.entityType
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.loadDocuments();
      }
    });
  }

  download(doc: Document) {
    window.open(this.documentsService.getDownloadUrl(doc.id), '_blank');
  }

  viewInline(doc: Document) {
    window.open(this.documentsService.getViewUrl(doc.id), '_blank');
  }

  formatBytes(bytes: number) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  isImage(doc: Document): boolean {
    const imgExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const ext = doc.extension?.toLowerCase().replace('.', '') || '';
    return imgExts.includes(ext);
  }

  getImageUrl(doc: Document): string {
    return this.documentsService.getViewUrl(doc.id);
  }
}
