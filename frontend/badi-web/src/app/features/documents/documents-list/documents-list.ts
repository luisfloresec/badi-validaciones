import { Component, OnInit, ChangeDetectorRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { DocumentsService, Document, DocumentStats, DocumentFilters } from '../documents.service';
import { DocumentTypesService, DocumentType } from '../document-types.service';
import { DocumentUploadDialogComponent } from '../document-upload-dialog/document-upload-dialog';
import { DocumentDetailDialogComponent } from '../document-detail-dialog/document-detail-dialog';
import { DocumentReplaceDialogComponent } from '../document-replace-dialog/document-replace-dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-documents-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    RouterModule
  ],
  templateUrl: './documents-list.html',
  styleUrls: ['./documents-list.scss']
})
export class DocumentsListComponent implements OnInit {
  documents: Document[] = [];
  stats: DocumentStats | null = null;
  documentTypes: DocumentType[] = [];
  
  loading = true;
  loadingStats = true;
  error: string | null = null;

  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;

  filters: DocumentFilters = {
    page: 1,
    limit: 10,
    search: '',
    tipoDocumentoId: '',
    estado: '',
    mostrarAnulados: false
  };

  displayedColumns: string[] = [
    'tipo', 'titulo', 'nombreArchivo', 'entidad', 'fechaCarga', 'tamano', 'estado', 'acciones'
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private documentsService: DocumentsService,
    private documentTypesService: DocumentTypesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTypes();
    this.loadStats();
    this.loadDocuments();
  }

  loadTypes() {
    this.documentTypesService.getAllActive().subscribe({
      next: (types) => this.documentTypes = types,
      error: () => console.error('Error cargando tipos de documento')
    });
  }

  loadStats() {
    this.loadingStats = true;
    this.documentsService.getStats().pipe(
      finalize(() => {
        this.loadingStats = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (stats) => this.stats = stats,
      error: () => console.error('Error cargando stats')
    });
  }

  loadDocuments() {
    this.loading = true;
    this.error = null;
    this.documentsService.getAll(this.filters)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          this.documents = res.data;
          this.totalItems = res.total;
        },
        error: (err) => {
          this.error = 'Error al cargar documentos';
          this.snackBar.open('Error al cargar documentos', 'Cerrar', { duration: 3000 });
        }
      });
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.filters.page = this.pageIndex + 1;
    this.filters.limit = this.pageSize;
    this.loadDocuments();
  }

  applyFilters() {
    this.pageIndex = 0;
    this.filters.page = 1;
    this.loadDocuments();
  }

  clearFilters() {
    this.filters = {
      page: 1,
      limit: 10,
      search: '',
      tipoDocumentoId: '',
      estado: '',
      mostrarAnulados: false
    };
    this.pageIndex = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadDocuments();
  }

  openUploadDialog() {
    const dialogRef = this.dialog.open(DocumentUploadDialogComponent, {
      width: '650px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.loadDocuments();
        this.loadStats();
      }
    });
  }

  openDetail(doc: Document) {
    const dialogRef = this.dialog.open(DocumentDetailDialogComponent, {
      width: '600px',
      data: doc
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.loadDocuments();
        this.loadStats();
      }
    });
  }

  openReplaceDialog(doc: Document) {
    const dialogRef = this.dialog.open(DocumentReplaceDialogComponent, {
      width: '500px',
      disableClose: true,
      data: doc
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.loadDocuments();
        this.loadStats();
      }
    });
  }

  download(doc: Document) {
    const url = this.documentsService.getDownloadUrl(doc.id);
    window.open(url, '_blank');
  }

  formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      'Activo': 'estado-activa',
      'Reemplazado': 'estado-inactiva',
      'Anulado': 'estado-inactiva',
      'Inactivo': 'estado-inactiva'
    };
    return map[estado] || '';
  }

  getEntidadLabel(doc: Document): string {
    if (!doc.entidadRelacionada) return 'General';
    return `${doc.entidadRelacionada}`;
  }
}
