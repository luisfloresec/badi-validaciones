import {
  Component, Input, OnInit, OnDestroy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { DocumentsService, Document } from '../documents.service';
import { DocumentUploadDialogComponent } from '../document-upload-dialog/document-upload-dialog';
import { DeliveryEvidenceUploadDialogComponent } from '../delivery-evidence-upload-dialog/delivery-evidence-upload-dialog';
import { AuthService } from '../../../core/auth/auth.service';

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
export class DocumentSectionComponent implements OnInit, OnDestroy {
  @Input() entityType!: 'ORGANIZACION' | 'CONVENIO' | 'ENTREGA_REALIZADA';
  @Input() entityId!: string;
  @Input() entityName?: string;
  @Input() allowedDocumentTypes?: string[];
  @Input() readonly?: boolean;

  documents: Document[] = [];
  loading = true;
  error: string | null = null;

  /** Map of docId → SafeUrl blob for image previews */
  blobUrls = new Map<string, SafeUrl>();
  loadingImages = new Map<string, boolean>();
  /** Track blob URLs to revoke on destroy */
  private rawBlobUrls: string[] = [];
  private subs: Subscription[] = [];

  constructor(
    private documentsService: DocumentsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (!this.entityType || !this.entityId) {
      this.error = 'Faltan parámetros requeridos';
      this.loading = false;
      return;
    }
    this.loadDocuments();
  }

  ngOnDestroy(): void {
    // Revoke all created blob URLs to avoid memory leaks
    this.rawBlobUrls.forEach(url => URL.revokeObjectURL(url));
    this.subs.forEach(s => s.unsubscribe());
  }

  loadDocuments() {
    this.loading = true;
    this.error = null;

    const sub = this.documentsService.getAll({
      entidadRelacionada: this.entityType,
      idEntidadRelacionada: this.entityId,
      estado: 'Activo',
      limit: 50
    })
    .pipe(finalize(() => {
      this.loading = false;
      this.cdr.detectChanges();
    }))
    .subscribe({
      next: (res) => {
        this.documents = res.data;
        // Pre-load image previews for image documents
        res.data.forEach(doc => {
          if (this.isImage(doc)) {
            this.loadImageBlob(doc);
          }
        });
      },
      error: () => {
        this.error = 'Error al cargar documentos asociados';
        this.snackBar.open('Error al cargar documentos asociados', 'Cerrar', { duration: 3000 });
      }
    });
    this.subs.push(sub);
  }

  /** Fetch image bytes with auth token and create a local blob URL */
  private loadImageBlob(doc: Document): void {
    const token = this.authService.getToken();
    if (!token) return;

    this.loadingImages.set(doc.id, true);
    const url = this.documentsService.getViewUrl(doc.id);
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    const sub = this.http.get(url, { headers, responseType: 'blob' }).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.rawBlobUrls.push(objectUrl);
        this.blobUrls.set(doc.id, this.sanitizer.bypassSecurityTrustUrl(objectUrl));
        this.loadingImages.set(doc.id, false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingImages.set(doc.id, false);
        this.cdr.detectChanges();
      }
    });
    this.subs.push(sub);
  }

  /** Get the safe blob URL for an image doc */
  getImageBlobUrl(doc: Document): SafeUrl | null {
    return this.blobUrls.get(doc.id) ?? null;
  }

  isImageLoading(doc: Document): boolean {
    return this.loadingImages.get(doc.id) ?? false;
  }

  openUploadDialog() {
    if (this.readonly) return;

    if (this.entityType === 'ENTREGA_REALIZADA') {
      const dialogRef = this.dialog.open(DeliveryEvidenceUploadDialogComponent, {
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
          setTimeout(() => {
            this.loadDocuments();
          }, 0);
        }
      });
    } else {
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
          setTimeout(() => {
            this.loadDocuments();
          }, 0);
        }
      });
    }
  }

  /** Download with auth token via blob trick */
  download(doc: Document) {
    const token = this.authService.getToken();
    if (!token) return;

    const url = this.documentsService.getDownloadUrl(doc.id);
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get(url, { headers, responseType: 'blob' }).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const a = globalThis.document.createElement('a');
        a.href = objectUrl;
        a.download = doc.nombreOriginal || `${doc.titulo}.${doc.extension}`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
      },
      error: () => {
        this.snackBar.open('Error al descargar el archivo', 'Cerrar', { duration: 3000 });
      }
    });
  }

  /** Open/view document in a new tab with auth token */
  viewInline(doc: Document) {
    const token = this.authService.getToken();
    if (!token) return;

    const url = this.documentsService.getViewUrl(doc.id);
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get(url, { headers, responseType: 'blob' }).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, '_blank');
        // Revoke after delay
        setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
      },
      error: () => {
        this.snackBar.open('No se pudo abrir el documento', 'Cerrar', { duration: 3000 });
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

  isImage(doc: Document): boolean {
    const imgExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const ext = doc.extension?.toLowerCase().replace('.', '') || '';
    return imgExts.includes(ext);
  }

  getDocIcon(doc: Document): string {
    const ext = doc.extension?.toLowerCase().replace('.', '') || '';
    if (['pdf'].includes(ext)) return 'picture_as_pdf';
    if (['doc', 'docx'].includes(ext)) return 'description';
    if (['xls', 'xlsx'].includes(ext)) return 'table_chart';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'image';
    return 'insert_drive_file';
  }

  getDocIconColor(doc: Document): string {
    const ext = doc.extension?.toLowerCase().replace('.', '') || '';
    if (['pdf'].includes(ext)) return '#ef4444';
    if (['doc', 'docx'].includes(ext)) return '#3b82f6';
    if (['xls', 'xlsx'].includes(ext)) return '#22c55e';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return '#8b5cf6';
    return '#6b7280';
  }

  getDocBgColor(doc: Document): string {
    const ext = doc.extension?.toLowerCase().replace('.', '') || '';
    if (['pdf'].includes(ext)) return '#fef2f2';
    if (['doc', 'docx'].includes(ext)) return '#eff6ff';
    if (['xls', 'xlsx'].includes(ext)) return '#f0fdf4';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return '#f5f3ff';
    return '#f3f4f6';
  }
}
