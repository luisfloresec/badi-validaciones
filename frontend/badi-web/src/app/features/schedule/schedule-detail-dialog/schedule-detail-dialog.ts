import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { ScheduleService, ScheduledDelivery } from '../schedule.service';
import { ScheduleRescheduleDialogComponent } from '../schedule-reschedule-dialog/schedule-reschedule-dialog';
import { ScheduleCancelDialogComponent } from '../schedule-cancel-dialog/schedule-cancel-dialog';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../core/config/api.config';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-schedule-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    IftaLabelModule,
    InputTextModule,
    TextareaModule,
    ButtonModule
  ],
  templateUrl: './schedule-detail-dialog.html',
  styleUrls: ['./schedule-detail-dialog.scss']
})
export class ScheduleDetailDialogComponent implements OnInit {
  delivery: ScheduledDelivery | null = null;
  realizedDeliveryId: string | null = null;
  isLoading = true;
  error: string | null = null;

  // Tracking changes for calendar refresh
  hasChanges = false;

  editMode = false;
  editDescripcion = '';
  editObservaciones = '';
  editCuota: number | null = null;
  isSaving = false;

  constructor(
    private scheduleService: ScheduleService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ScheduleDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: string },
    private cdr: ChangeDetectorRef,
    private router: Router,
    private http: HttpClient,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    queueMicrotask(() => this.loadDetail());
  }

  loadDetail(): void {
    if (!this.data?.id) {
      this.error = 'No se proporcionó un ID válido para cargar el detalle.';
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.delivery = null;
    this.cdr.markForCheck();

    this.scheduleService.getById(this.data.id)
      .subscribe({
        next: (res) => {
          this.delivery = res;
          
          if (this.delivery.estado !== 'Cancelado') {
            this.http.get<any>(`${API_BASE_URL}/realized-deliveries/by-schedule/${this.delivery.id}`)
              .pipe(finalize(() => {
                this.isLoading = false;
                this.cdr.markForCheck();
              }))
              .subscribe({
                next: (rd) => {
                  this.realizedDeliveryId = rd ? rd.id : null;
                  this.cdr.markForCheck();
                },
                error: (err) => {
                  // Not found is expected if no realized delivery exists
                  this.realizedDeliveryId = null;
                  this.cdr.markForCheck();
                }
              });
          } else {
            this.isLoading = false;
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.error = err.error?.message || 'Error al cargar el detalle de la entrega programada.';
          this.snackBar.open(this.error as string, 'Cerrar', { duration: 4000 });
        }
      });
  }

  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      'Programado': 'estado-programada',
      'Reprogramado': 'estado-reprogramada',
      'Cancelado': 'estado-cancelada',
      'Finalizado': 'estado-finalizada'
    };
    return map[estado] || '';
  }

  get isEditable(): boolean {
    if (!this.authService.canEdit()) return false;
    return (this.delivery?.estado === 'Programado' || this.delivery?.estado === 'Reprogramado') && !this.realizedDeliveryId;
  }

  private formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private todayLocalDate(): string {
    return this.formatLocalDate(new Date());
  }

  get canRegisterDelivery(): boolean {
    if (!this.authService.canEdit()) return false;
    if (!this.isEditable || !this.delivery?.fechaProgramada || this.realizedDeliveryId) return false;

    const todayStr = this.todayLocalDate();
    let deliveryDateStr = this.delivery.fechaProgramada as unknown as string;
    if (typeof deliveryDateStr === 'string') {
      deliveryDateStr = deliveryDateStr.substring(0, 10);
    }

    return todayStr >= deliveryDateStr;
  }

  get descripcionLength(): number {
    return this.editDescripcion?.length || 0;
  }

  // ── Edit Mode ──────────────────────────

  enterEditMode(): void {
    this.editDescripcion = this.delivery?.descripcion || '';
    this.editObservaciones = this.delivery?.observaciones || '';
    this.editCuota = this.delivery?.cuota ?? null;
    this.editMode = true;
  }

  cancelEditMode(): void {
    this.editMode = false;
  }

  saveEdit(): void {
    if (!this.delivery) return;
    if (this.editDescripcion.length > 300) return;

    this.isSaving = true;
    const payload: { descripcion?: string; observaciones?: string; cuota?: number } = {
      descripcion: this.editDescripcion.trim() || undefined,
      observaciones: this.editObservaciones.trim() || undefined,
      cuota: this.editCuota !== null && this.editCuota !== undefined && this.editCuota.toString() !== '' ? Number(this.editCuota) : undefined
    };

    this.scheduleService.update(this.delivery.id, payload).subscribe({
      next: (updated) => {
        this.delivery = updated;
        this.editMode = false;
        this.isSaving = false;
        this.hasChanges = true;
        this.snackBar.open('Entrega actualizada exitosamente', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        const message = err.error?.message || 'Error al actualizar la entrega';
        this.snackBar.open(
          Array.isArray(message) ? message.join('. ') : message,
          'Cerrar',
          { duration: 5000 }
        );
        this.isSaving = false;
      }
    });
  }

  isSeguimientoDropdownOpen = false;

  toggleSeguimientoDropdown(event?: Event): void {
    if (!this.authService.canEdit()) return;
    if (event) {
      event.stopPropagation();
    }
    this.isSeguimientoDropdownOpen = !this.isSeguimientoDropdownOpen;
  }

  onEstadoSeguimientoSelect(newState: string): void {
    if (!this.delivery || this.delivery.estadoSeguimiento === newState) {
      this.isSeguimientoDropdownOpen = false;
      return;
    }
    
    const oldState = this.delivery.estadoSeguimiento;
    this.delivery.estadoSeguimiento = newState;
    this.isSeguimientoDropdownOpen = false;
    
    this.scheduleService.update(this.delivery.id, { estadoSeguimiento: newState }).subscribe({
      next: (updated) => {
        this.delivery = updated;
        this.hasChanges = true;
        this.snackBar.open('Estado de seguimiento actualizado', 'Cerrar', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Error al actualizar el estado de seguimiento', 'Cerrar', { duration: 3000 });
        this.delivery!.estadoSeguimiento = oldState; // revertir
        this.cdr.markForCheck();
      }
    });
  }

  getOrganizationName(): string {
    return this.delivery?.organizacion?.razonSocial
      || this.delivery?.organizacion?.nombreComercial
      || 'Organización sin nombre';
  }

  // ── Reschedule ─────────────────────────

  openReschedule(): void {
    if (!this.delivery) return;

    const ref = this.dialog.open(ScheduleRescheduleDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        id: this.delivery.id,
        fechaActual: this.delivery.fechaProgramada
      }
    });

    ref.afterClosed().subscribe(result => {
      if (result) {
        this.hasChanges = true;
        this.loadDetail(); // Reload to show updated state
        this.snackBar.open('Entrega reprogramada exitosamente', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // ── Cancel ─────────────────────────────

  openCancel(): void {
    if (!this.delivery) return;

    const ref = this.dialog.open(ScheduleCancelDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        id: this.delivery.id
      }
    });

    ref.afterClosed().subscribe(result => {
      if (result) {
        this.hasChanges = true;
        this.loadDetail(); // Reload to show cancelled state
        this.snackBar.open('Entrega cancelada', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // ── Close ──────────────────────────────

  closeDialog(): void {
    this.dialogRef.close(this.hasChanges);
  }

  // ── Register Realized Delivery ──────────
  registerRealizedDelivery(): void {
    if (!this.delivery) return;
    this.dialogRef.close(this.hasChanges);
    this.router.navigate(['/realized-deliveries/new'], { 
      queryParams: { scheduleId: this.delivery.id, returnUrl: this.router.url } 
    });
  }

  // ── View Realized Delivery ──────────────
  viewRealizedDelivery(): void {
    if (!this.realizedDeliveryId) return;
    this.dialogRef.close(this.hasChanges);
    this.router.navigate(['/realized-deliveries', this.realizedDeliveryId], {
      queryParams: { returnUrl: this.router.url }
    });
  }
}
