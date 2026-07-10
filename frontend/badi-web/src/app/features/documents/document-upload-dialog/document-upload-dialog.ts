import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { IftaLabelModule } from 'primeng/iftalabel';
import { FluidModule } from 'primeng/fluid';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DocumentsService } from '../documents.service';
import { DocumentTypesService, DocumentType } from '../document-types.service';

@Component({
  selector: 'app-document-upload-dialog',
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
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
    IftaLabelModule,
    FluidModule,
    ButtonModule,
    DatePickerModule
  ],
  templateUrl: './document-upload-dialog.html',
  styleUrls: ['./document-upload-dialog.scss']
})
export class DocumentUploadDialogComponent implements OnInit {
  uploadForm: FormGroup;
  documentTypes: DocumentType[] = [];
  selectedType: DocumentType | null = null;
  selectedFile: File | null = null;
  isUploading = false;
  
  // Context passed when opened from an Organization or Agreement
  prefilledEntity: string | null = null;
  prefilledEntityId: string | null = null;
  entityName: string | null = null;

  // origenCarga determined from dialog data: ORGANIZACION, CONVENIO, or GESTION_DOCUMENTAL
  get origenCarga(): string {
    if (this.prefilledEntity === 'ORGANIZACION') return 'ORGANIZACION';
    if (this.prefilledEntity === 'CONVENIO') return 'CONVENIO';
    if (this.prefilledEntity === 'ENTREGA_REALIZADA') return 'ENTREGA_REALIZADA';
    return 'GESTION_DOCUMENTAL';
  }

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DocumentUploadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private documentsService: DocumentsService,
    private documentTypesService: DocumentTypesService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    if (data?.entidadRelacionada) this.prefilledEntity = data.entidadRelacionada;
    if (data?.idEntidadRelacionada) this.prefilledEntityId = data.idEntidadRelacionada;
    if (data?.entityName) this.entityName = data.entityName;

    this.uploadForm = this.fb.group({
      tipoDocumentoId: ['', Validators.required],
      titulo: ['', [Validators.required, Validators.maxLength(300)]],
      descripcion: [''],
      entidadRelacionada: [{ value: this.prefilledEntity || '', disabled: !!this.prefilledEntity }],
      idEntidadRelacionada: [{ value: this.prefilledEntityId || '', disabled: !!this.prefilledEntityId }]
    });
  }

  ngOnInit(): void {
    this.documentTypesService.getAllActive().subscribe(types => {
      if (this.prefilledEntity) {
        if (this.prefilledEntity === 'ENTREGA_REALIZADA') {
          // Rule: Only allow specific types for realized deliveries
          this.documentTypes = types.filter(t => 
            t.nombre === 'Registro fotográfico' || t.nombre === 'Otro'
          );
        } else {
          this.documentTypes = types.filter(t => t.entidadesPermitidas.includes(this.prefilledEntity!));
        }
      } else {
        // Global repo
        this.documentTypes = types.filter(t => t.permiteCargaGeneral && t.nombre !== 'Registro fotográfico');
        // By default, if opened from central repo, we set it to GENERAL
        this.uploadForm.patchValue({ entidadRelacionada: 'GENERAL' });
      }
      this.cdr.detectChanges();
    });

    this.uploadForm.get('tipoDocumentoId')?.valueChanges.subscribe(id => {
      this.selectedType = this.documentTypes.find(t => t.id === id) || null;
      this.updateValidatorsBasedOnType();
      this.cdr.detectChanges();
    });
  }

  updateValidatorsBasedOnType() {
    if (!this.selectedType) return;
    this.uploadForm.get('observaciones')?.clearValidators();
    this.uploadForm.get('observaciones')?.updateValueAndValidity();
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      if (this.selectedType) {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (!this.selectedType.extensionesPermitidas.includes(ext)) {
          this.snackBar.open(`Extensión .${ext} no permitida.`, 'Cerrar', { duration: 3000 });
          this.selectedFile = null;
          event.target.value = '';
          this.cdr.detectChanges();
          return;
        }
        
        const sizeMb = file.size / (1024 * 1024);
        if (sizeMb > this.selectedType.tamanoMaximoMb) {
          this.snackBar.open(`El archivo excede los ${this.selectedType.tamanoMaximoMb}MB permitidos.`, 'Cerrar', { duration: 3000 });
          this.selectedFile = null;
          event.target.value = '';
          this.cdr.detectChanges();
          return;
        }
      }
      this.selectedFile = file;
      this.cdr.detectChanges();
    }
  }

  formatDisplayDate(date: Date | string | null): string {
    if (!date) return 'Seleccione una fecha';

    const value = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    if (isNaN(value.getTime())) return 'Seleccione una fecha';

    return new Intl.DateTimeFormat('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(value);
  }

  onSubmit() {
    if (this.uploadForm.invalid || !this.selectedFile) {
      this.uploadForm.markAllAsTouched();
      if (!this.selectedFile) {
        this.snackBar.open('Debe seleccionar un archivo', 'Cerrar', { duration: 3000 });
      }
      this.cdr.detectChanges();
      return;
    }

    this.isUploading = true;
    this.cdr.detectChanges();
    const formValue = this.uploadForm.getRawValue();

    // Build a clean payload: fechaDocumento as YYYY-MM-DD string, origenCarga as plain string
    const payload: Record<string, string> = {};
    payload['tipoDocumentoId'] = formValue.tipoDocumentoId;
    payload['titulo'] = formValue.titulo;
    payload['origenCarga'] = this.origenCarga;

    if (formValue.descripcion) payload['descripcion'] = formValue.descripcion;
    if (formValue.observaciones) payload['observaciones'] = formValue.observaciones;

    // Serialize entidadRelacionada
    const entidad = formValue.entidadRelacionada || this.prefilledEntity;
    if (entidad) payload['entidadRelacionada'] = entidad;

    const entityId = formValue.idEntidadRelacionada || this.prefilledEntityId;
    if (entityId) payload['idEntidadRelacionada'] = entityId;

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    payload['fechaDocumento'] = `${y}-${m}-${d}`;

    this.documentsService.upload(payload, this.selectedFile).subscribe({
      next: (doc) => {
        this.snackBar.open('Documento subido con éxito', 'Cerrar', { duration: 3000 });
        setTimeout(() => {
          this.isUploading = false;
          this.cdr.detectChanges();
          this.dialogRef.close(doc);
        }, 0);
      },
      error: (err) => {
        this.isUploading = false;
        this.cdr.detectChanges();
        this.snackBar.open(
          'No se pudo subir el documento. Revisa la fecha y el origen de carga.',
          'Cerrar',
          { duration: 5000 }
        );
        console.error('Upload error:', err);
      }
    });
  }
}
