import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs/operators';
import {
  OrganizationsService,
  OrganizationFullDetail
} from '../organizations.service';

@Component({
  selector: 'app-organization-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './organization-detail.html',
  styleUrl: './organization-detail.scss'
})
export class OrganizationDetailComponent implements OnInit {

  detail: OrganizationFullDetail | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orgService: OrganizationsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDetail(id);
    } else {
      this.error = 'No se proporcionó un ID de organización válido.';
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  loadDetail(id: string): void {
    this.loading = true;
    this.error = null;

    this.orgService.getFullDetail(id)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.detail = data;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading organization detail:', err);
          this.error = 'No se pudo cargar el detalle de la organización.';
          this.detail = null;
          this.cdr.detectChanges();
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/organizations']);
  }

  isGad(): boolean {
    return this.detail?.organizacion?.tipoOrganizacion?.nombre === 'GAD';
  }

  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      'Registrada': 'estado-registrada',
      'Activa': 'estado-activa',
      'Inactiva': 'estado-inactiva'
    };
    return map[estado] || '';
  }

  getRepresentativeName(id: string | null): string {
    if (!id || !this.detail) return '—';
    const rep = this.detail.representantes.find(r => r.id === id);
    return rep ? `${rep.nombres} ${rep.apellidos}` : '—';
  }

  formatCurrency(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return 'No especificado';
    }
  
    const numericValue = Number(value);
  
    if (Number.isNaN(numericValue)) {
      return 'No especificado';
    }
  
    return `$${numericValue.toFixed(2)}`;
  }
}
