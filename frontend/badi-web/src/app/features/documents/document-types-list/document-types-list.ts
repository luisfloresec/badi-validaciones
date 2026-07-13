import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { finalize } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { DocumentTypesService, DocumentType } from '../document-types.service';
import { DocumentTypeFormDialogComponent } from '../document-type-form-dialog/document-type-form-dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-document-types-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    ButtonModule
  ],
  templateUrl: './document-types-list.html',
  styleUrls: ['./document-types-list.scss']
})
export class DocumentTypesListComponent implements OnInit {
  types: DocumentType[] = [];
  loading = true;
  error: string | null = null;

  displayedColumns: string[] = [
    'nombre', 'codigo', 'entidades', 'extensiones', 'tamano', 'reglas', 'estado', 'acciones'
  ];

  constructor(
    private documentTypesService: DocumentTypesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadTypes();
  }

  loadTypes() {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    this.documentTypesService.getAll()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          this.types = res ?? [];
          this.cdr.detectChanges();
        },
        error: () => {
          this.error = 'Error al cargar tipos documentales';
          this.snackBar.open('Error al cargar tipos documentales', 'Cerrar', { duration: 3000 });
          this.types = [];
          this.cdr.detectChanges();
        }
      });
  }

  openForm(type?: DocumentType) {
    const dialogRef = this.dialog.open(DocumentTypeFormDialogComponent, {
      width: '680px',
      disableClose: true,
      data: { type }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadTypes();
    });
  }

  deactivate(type: DocumentType) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Desactivar tipo documental',
        message: `¿Está seguro de desactivar el tipo "${type.nombre}"?`,
        secondaryText: 'No podrá ser seleccionado para nuevos documentos. Los documentos existentes no se verán afectados.',
        confirmText: 'Desactivar',
        cancelText: 'Cancelar',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.documentTypesService.deactivate(type.id).subscribe({
          next: () => {
            this.snackBar.open('Tipo desactivado', 'Cerrar', { duration: 3000 });
            this.loadTypes();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error al desactivar', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  activate(type: DocumentType) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Reactivar tipo documental',
        message: `¿Está seguro de reactivar el tipo "${type.nombre}"?`,
        secondaryText: 'Volverá a estar disponible para ser seleccionado en nuevos documentos.',
        confirmText: 'Reactivar',
        cancelText: 'Cancelar',
        confirmColor: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.documentTypesService.activate(type.id).subscribe({
          next: () => {
            this.snackBar.open('Tipo reactivado', 'Cerrar', { duration: 3000 });
            this.loadTypes();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error al reactivar', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  getEstadoClass(estado: string): string {
    return estado === 'Activo' ? 'estado-activa' : 'estado-inactiva';
  }

  reglasLabel(type: DocumentType): string {
    const parts: string[] = [];
    if (type.requiereEntidadRelacionada) parts.push('Req. entidad');
    if (type.requiereFechaDocumento) parts.push('Req. fecha');
    if (type.observacionesObligatorias) parts.push('Req. obs.');
    if (!type.permiteCargaGeneral) parts.push('No general');
    return parts.length ? parts.join(' · ') : 'Sin restricciones especiales';
  }
}
