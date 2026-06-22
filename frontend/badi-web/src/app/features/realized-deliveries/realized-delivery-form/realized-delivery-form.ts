import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RealizedDeliveriesService } from '../realized-deliveries.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-realized-delivery-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    RouterModule
  ],
  templateUrl: './realized-delivery-form.html',
  styleUrls: ['./realized-delivery-form.scss']
})
export class RealizedDeliveryFormComponent implements OnInit {
  deliveryForm: FormGroup;
  isSaving = false;
  isLoadingContext = true;
  scheduleId: string | null = null;
  scheduledDelivery: any = null;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private realizedDeliveriesService: RealizedDeliveriesService,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.deliveryForm = this.fb.group({
      fechaRealizacion: ['', Validators.required],
      kilosEntregados: ['', [Validators.required, Validators.min(0.01)]],
      personasAtendidas: ['', [Validators.required, Validators.min(0)]],
      beneficiariosAtendidos: ['', [Validators.min(0)]],
      detalleProductos: ['', Validators.required],
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    // Suscribirse a los query params para reaccionar si cambian
    this.route.queryParamMap.subscribe(params => {
      this.scheduleId = params.get('scheduleId');
      if (!this.scheduleId) {
        this.error = 'No se proporcionó un ID de entrega programada válido.';
        this.isLoadingContext = false;
        this.cdr.detectChanges();
        return;
      }
      this.loadContext();
    });
  }

  loadContext() {
    this.isLoadingContext = true;
    this.error = null;
    this.scheduledDelivery = null;
    this.cdr.detectChanges();

    // Load context: the scheduled delivery to prefill data and show context
    this.http.get<any>(`http://localhost:3000/schedules/${this.scheduleId}`).subscribe({
      next: (schedule) => {
        this.scheduledDelivery = schedule;
        
        // Check state
        if (['Cancelado', 'Realizado'].includes(schedule.estado)) {
          this.error = `No se puede registrar entrega. Estado actual: ${schedule.estado}`;
        }
        
        // Prefill date
        if (schedule.fechaProgramada) {
          this.deliveryForm.patchValue({
            fechaRealizacion: schedule.fechaProgramada.substring(0, 10)
          });
        }
        
        this.isLoadingContext = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'No se pudo cargar la entrega programada.';
        this.isLoadingContext = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit() {
    if (this.deliveryForm.invalid || !this.scheduleId) {
      this.deliveryForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const formValue = this.deliveryForm.value;

    const payload = {
      idEntregaProgramada: this.scheduleId,
      fechaRealizacion: formValue.fechaRealizacion,
      kilosEntregados: Number(formValue.kilosEntregados),
      personasAtendidas: Number(formValue.personasAtendidas),
      beneficiariosAtendidos: formValue.beneficiariosAtendidos ? Number(formValue.beneficiariosAtendidos) : undefined,
      detalleProductos: formValue.detalleProductos,
      observaciones: formValue.observaciones
    };

    this.realizedDeliveriesService.create(payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.snackBar.open('Entrega realizada registrada con éxito.', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/realized-deliveries', res.id]);
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err.error?.message || 'Error al guardar la entrega.';
        this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
      }
    });
  }
}
