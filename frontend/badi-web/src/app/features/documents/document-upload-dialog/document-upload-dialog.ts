import { Component, Inject, OnInit } from '@angular/core';
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
    MatProgressSpinnerModule
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
    private snackBar: MatSnackBar
  ) {
    if (data?.entidadRelacionada) this.prefilledEntity = data.entidadRelacionada;
    if (data?.idEntidadRelacionada) this.prefilledEntityId = data.idEntidadRelacionada;

    this.uploadForm = this.fb.group({
      tipoDocumentoId: ['', Validators.required],
      titulo: ['', [Validators.required, Validators.maxLength(300)]],
      descripcion: [''],
      entidadRelacionada: [{ value: this.prefilledEntity || '', disabled: !!this.prefilledEntity }],
      idEntidadRelacionada: [{ value: this.prefilledEntityId || '', disabled: !!this.prefilledEntityId }],
      fechaDocumento: [''],
      observaciones: ['']
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
    });

    this.uploadForm.get('tipoDocumentoId')?.valueChanges.subscribe(id => {
      this.selectedType = this.documentTypes.find(t => t.id === id) || null;
      this.updateValidatorsBasedOnType();
    });
  }

  updateValidatorsBasedOnType() {
    if (!this.selectedType) return;
    
    if (this.selectedType.observacionesObligatorias) {
      this.uploadForm.get('observaciones')?.setValidators([Validators.required]);
    } else {
      this.uploadForm.get('observaciones')?.clearValidators();
    }
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
          return;
        }
        
        const sizeMb = file.size / (1024 * 1024);
        if (sizeMb > this.selectedType.tamanoMaximoMb) {
          this.snackBar.open(`El archivo excede los ${this.selectedType.tamanoMaximoMb}MB permitidos.`, 'Cerrar', { duration: 3000 });
          this.selectedFile = null;
          event.target.value = '';
          return;
        }
      }
      this.selectedFile = file;
    }
  }

  onSubmit() {
    if (this.uploadForm.invalid || !this.selectedFile) {
      this.uploadForm.markAllAsTouched();
      if (!this.selectedFile) {
        this.snackBar.open('Debe seleccionar un archivo', 'Cerrar', { duration: 3000 });
      }
      return;
    }

    this.isUploading = true;
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

    // Serialize fechaDocumento as YYYY-MM-DD (never as Date object or full ISO string)
    if (formValue.fechaDocumento) {
      const raw = formValue.fechaDocumento;
      if (raw instanceof Date) {
        const y = raw.getFullYear();
        const m = String(raw.getMonth() + 1).padStart(2, '0');
        const d = String(raw.getDate()).padStart(2, '0');
        payload['fechaDocumento'] = `${y}-${m}-${d}`;
      } else if (typeof raw === 'string' && raw.length > 0) {
        // Take only the date part in case the datepicker returns a full ISO string
        payload['fechaDocumento'] = raw.substring(0, 10);
      }
    }

    this.documentsService.upload(payload, this.selectedFile).subscribe({
      next: (doc) => {
        this.isUploading = false;
        this.snackBar.open('Documento subido con éxito', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(doc);
      },
      error: (err) => {
        this.isUploading = false;
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
