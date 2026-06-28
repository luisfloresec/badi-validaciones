import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subscription, Subject } from 'rxjs';
import { filter, finalize, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DatePickerModule } from 'primeng/datepicker';
import { DocumentsService, Document, DocumentStats, DocumentFilters } from '../documents.service';
import { DocumentTypesService, DocumentType } from '../document-types.service';
import { OrganizationsService, OrganizationSummary } from '../../organizations/organizations.service';
import { AgreementsService, Agreement } from '../../agreements/agreements.service';
import { DocumentUploadDialogComponent } from '../document-upload-dialog/document-upload-dialog';
import { DocumentDetailDialogComponent } from '../document-detail-dialog/document-detail-dialog';
import { DocumentReplaceDialogComponent } from '../document-replace-dialog/document-replace-dialog';
import { DocumentMetadataDialogComponent } from '../document-metadata-dialog/document-metadata-dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { AuthService } from '../../../core/auth/auth.service';

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
    MatDatepickerModule,
    MatNativeDateModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    CheckboxModule,
    IconFieldModule,
    InputIconModule,
    ToggleSwitchModule,
    DatePickerModule
  ],
  templateUrl: './documents-list.html',
  styleUrls: ['./documents-list.scss']
})
export class DocumentsListComponent implements OnInit, OnDestroy {
  documents: Document[] = [];
  stats: DocumentStats | null = null;
  documentTypes: DocumentType[] = [];
  organizations: OrganizationSummary[] = [];
  agreements: Agreement[] = [];
  
  loading = true;
  loadingStats = true;
  error: string | null = null;

  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;

  filterEntityTypes = [
    { label: 'Todas las entidades', value: '' },
    { label: 'Organizaciones', value: 'ORGANIZACION' },
    { label: 'Convenios', value: 'CONVENIO' },
    { label: 'Entregas Realizadas', value: 'ENTREGA_REALIZADA' },
    { label: 'Repositorio Global', value: 'GENERAL' }
  ];

  filters: DocumentFilters = {
    page: 1,
    limit: 10,
    search: '',
    tipoDocumentoId: '',
    entityType: '',
    organizacionId: '',
    convenioId: '',
    fechaDesde: '',
    fechaHasta: '',
    estado: '',
    mostrarAnulados: false
  };

  // Helper variables for binding PrimeNG datepicker objects
  fechaDesdeObj: Date | null = null;
  fechaHastaObj: Date | null = null;

  searchSubject = new Subject<string>();
  private subs: Subscription[] = [];

  displayedColumns: string[] = [
    'docInfo', 'tipo', 'entidad', 'fechaCarga', 'fechaDocumento', 'tamano', 'estado', 'acciones'
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private documentsService: DocumentsService,
    private documentTypesService: DocumentTypesService,
    private organizationsService: OrganizationsService,
    private agreementsService: AgreementsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTypes();
    this.loadOrganizations();
    this.loadAgreements();
    this.loadStats();
    this.loadDocuments();

    // Requisito: Debounce para la búsqueda de texto para que permita seguir escribiendo sin perder foco
    const searchSub = this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(() => {
      this.pageIndex = 0;
      this.filters.page = 1;
      if (this.paginator) {
        this.paginator.pageIndex = 0;
      }
      this.loadDocuments();
    });
    this.subs.push(searchSub);

    // Requisito: Al hacer clic en "Repositorio Global" desde el menú, recargar los documentos automáticamente
    const routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (event.url === '/documents' || event.urlAfterRedirects === '/documents') {
        this.loadStats();
        this.loadDocuments();
      }
    });
    this.subs.push(routerSub);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  onSearchChange(value: string) {
    this.filters.search = value;
    this.searchSubject.next(value);
  }

  loadTypes() {
    this.documentTypesService.getAllActive().subscribe({
      next: (types: DocumentType[]) => {
        this.documentTypes = types;
        this.cdr.detectChanges();
      },
      error: () => console.error('Error cargando tipos de documento')
    });
  }

  loadOrganizations() {
    this.organizationsService.getAll(false).subscribe({
      next: (orgs: OrganizationSummary[]) => {
        this.organizations = orgs;
        this.cdr.detectChanges();
      },
      error: () => console.error('Error cargando organizaciones')
    });
  }

  loadAgreements() {
    this.agreementsService.getAll().subscribe({
      next: (agreements: Agreement[]) => {
        this.agreements = agreements;
        this.cdr.detectChanges();
      },
      error: () => console.error('Error cargando convenios')
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
      next: (stats: DocumentStats) => {
        this.stats = stats;
        this.cdr.detectChanges();
      },
      error: () => console.error('Error cargando stats')
    });
  }

  loadDocuments() {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    const currentFilters: DocumentFilters = { ...this.filters };
    if (this.fechaDesdeObj) {
      const y = this.fechaDesdeObj.getFullYear();
      const m = String(this.fechaDesdeObj.getMonth() + 1).padStart(2, '0');
      const d = String(this.fechaDesdeObj.getDate()).padStart(2, '0');
      currentFilters.fechaDesde = `${y}-${m}-${d}`;
    } else {
      delete currentFilters.fechaDesde;
    }

    if (this.fechaHastaObj) {
      const y = this.fechaHastaObj.getFullYear();
      const m = String(this.fechaHastaObj.getMonth() + 1).padStart(2, '0');
      const d = String(this.fechaHastaObj.getDate()).padStart(2, '0');
      currentFilters.fechaHasta = `${y}-${m}-${d}`;
    } else {
      delete currentFilters.fechaHasta;
    }

    this.documentsService.getAll(currentFilters)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          this.documents = res.data ?? [];
          this.totalItems = res.total ?? 0;
          this.cdr.detectChanges();
        },
        error: () => {
          this.error = 'Error al cargar documentos';
          this.snackBar.open('Error al cargar documentos', 'Cerrar', { duration: 3000 });
          this.documents = [];
          this.totalItems = 0;
          this.cdr.detectChanges();
        }
      });
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.filters.page = this.pageIndex + 1;
    this.filters.limit = this.pageSize;
    this.cdr.detectChanges();
    this.loadDocuments();
  }

  applyFilters() {
    this.pageIndex = 0;
    this.filters.page = 1;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.cdr.detectChanges();
    this.loadDocuments();
  }

  clearFilters() {
    this.filters = {
      page: 1,
      limit: 10,
      search: '',
      tipoDocumentoId: '',
      entityType: '',
      organizacionId: '',
      convenioId: '',
      fechaDesde: '',
      fechaHasta: '',
      estado: '',
      mostrarAnulados: false
    };
    this.fechaDesdeObj = null;
    this.fechaHastaObj = null;
    this.pageIndex = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.cdr.detectChanges();
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
      width: '700px',
      data: doc
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.loadDocuments();
        this.loadStats();
      }
    });
  }

  openMetadataDialog(doc: Document) {
    const dialogRef = this.dialog.open(DocumentMetadataDialogComponent, {
      width: '650px',
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

  openReplaceDialog(doc: Document) {
    const dialogRef = this.dialog.open(DocumentReplaceDialogComponent, {
      width: '550px',
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

  viewFile(doc: Document) {
    const token = this.authService.getToken();
    if (!token) return;

    const url = this.documentsService.getViewUrl(doc.id);
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

  annulDocument(doc: Document) {
    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Anular Documento',
        message: `¿Está seguro de anular el documento "${doc.titulo}"? Esta acción mantendrá el archivo para auditoría, pero lo marcará como anulado.`,
        confirmText: 'Anular documento',
        confirmColor: 'warn'
      }
    });

    confirmRef.afterClosed().subscribe(res => {
      if (res) {
        this.documentsService.annul(doc.id).subscribe({
          next: () => {
            this.snackBar.open('Documento anulado con éxito', 'Cerrar', { duration: 3000 });
            this.loadDocuments();
            this.loadStats();
          },
          error: () => {
            this.snackBar.open('Error al anular el documento', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  getFileIcon(doc: Document): string {
    const ext = doc.extension?.toLowerCase().replace('.', '') || '';
    if (['pdf'].includes(ext)) return 'picture_as_pdf';
    if (['doc', 'docx'].includes(ext)) return 'description';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'table_chart';
    if (['ppt', 'pptx'].includes(ext)) return 'slideshow';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (['zip', 'rar', '7z'].includes(ext)) return 'folder_zip';
    return 'insert_drive_file';
  }

  formatBytes(bytes: number | undefined, decimals = 2) {
    if (bytes === undefined || !+bytes) return '0 Bytes';
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
    if (doc.entityName && doc.entityName !== 'Repositorio Global') {
      return `${doc.entityName} (${doc.entidadRelacionada})`;
    }
    if (doc.entidadRelacionada && doc.entidadRelacionada !== 'GENERAL') {
      return `${doc.entidadRelacionada}`;
    }
    return 'Repositorio Global (General)';
  }
}
