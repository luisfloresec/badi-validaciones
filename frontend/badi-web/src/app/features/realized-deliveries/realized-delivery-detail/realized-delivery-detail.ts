import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { RealizedDeliveriesService, RealizedDelivery } from '../realized-deliveries.service';
import { DocumentSectionComponent } from '../../documents/document-section/document-section';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-realized-delivery-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    ButtonModule,
    DocumentSectionComponent
  ],
  templateUrl: './realized-delivery-detail.html',
  styleUrls: ['./realized-delivery-detail.scss']
})
export class RealizedDeliveryDetailComponent implements OnInit, OnDestroy {
  delivery: RealizedDelivery | null = null;
  isLoading = true;
  error: string | null = null;

  private routeSub: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private realizedDeliveriesService: RealizedDeliveriesService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Subscribe to paramMap so the component reloads if the ID changes
    // (e.g. navigating from one detail to another without leaving the component)
    this.routeSub = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadDelivery(id);
      } else {
        this.error = 'ID de entrega no válido.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  loadDelivery(id: string) {
    this.isLoading = true;
    this.delivery = null;
    this.error = null;
    this.cdr.detectChanges();

    this.realizedDeliveriesService.findById(id).subscribe({
      next: (res) => {
        this.delivery = res;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Error al cargar el detalle de la entrega.';
        this.isLoading = false;
        this.cdr.detectChanges();
        this.snackBar.open(this.error, 'Cerrar', { duration: 4000 });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/realized-deliveries']);
  }

  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      'Registrada': 'estado-registrada',
      'Activa': 'estado-activa',
      'Activo': 'estado-activa',
      'Anulada': 'estado-inactiva',
      'Inactiva': 'estado-inactiva',
      'Inactivo': 'estado-inactiva'
    };
    return map[estado] || 'estado-registrada';
  }
}
