import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { RealizedDeliveriesService, RealizedDelivery } from '../realized-deliveries.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-realized-deliveries-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCardModule,
    MatPaginatorModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SelectModule,
    ButtonModule
  ],
  templateUrl: './realized-deliveries-list.html',
  styleUrls: ['./realized-deliveries-list.scss']
})
export class RealizedDeliveriesListComponent implements OnInit {
  deliveries: RealizedDelivery[] = [];
  filteredDeliveries: RealizedDelivery[] = [];
  paginatedDeliveries: RealizedDelivery[] = [];
  isLoading = true;
  error: string | null = null;
  searchTerm = '';
  filterEstado = 'TODOS';

  estadoOptions = [
    { label: 'Todos los estados', value: 'TODOS' },
    { label: 'Registrada', value: 'Registrada' },
    { label: 'Anulada', value: 'Anulada' }
  ];

  // Estadísticas
  entregasMes = 0;
  kilosMes = 0;
  personasMes = 0;
  totalKilos = 0;
  entregasAnuladas = 0;

  // Paginación
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;

  constructor(
    private service: RealizedDeliveriesService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDeliveries();
  }

  loadDeliveries(): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.service.findAll().subscribe({
      next: (data) => {
        this.deliveries = data;
        this.calculateStats();
        this.isLoading = false;
        this.onSearch();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'No se pudieron cargar las entregas realizadas.';
        this.isLoading = false;
        this.deliveries = [];
        this.onSearch();
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }

  calculateStats(): void {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    this.entregasMes = 0;
    this.kilosMes = 0;
    this.personasMes = 0;
    this.totalKilos = 0;
    this.entregasAnuladas = 0;

    for (const d of this.deliveries) {
      const kilos = Number(d.kilosEntregados) || 0;
      const personas = Number(d.personasAtendidas) || 0;
      this.totalKilos += kilos;

      if (d.estado === 'Anulada') {
        this.entregasAnuladas++;
      }

      if (d.fechaRealizacion) {
        const dateObj = new Date(d.fechaRealizacion);
        if (dateObj.getFullYear() === currentYear && dateObj.getMonth() === currentMonth) {
          this.entregasMes++;
          this.kilosMes += kilos;
          this.personasMes += personas;
        }
      }
    }
  }

  onSearch(): void {
    const term = this.searchTerm.toLowerCase().trim();

    this.filteredDeliveries = this.deliveries.filter(d => {
      const matchesEstado = this.filterEstado === 'TODOS' || d.estado === this.filterEstado;
      if (!matchesEstado) return false;

      if (!term) return true;

      const orgName = d.organizacion?.razonSocial?.toLowerCase() || '';
      const orgComercial = d.organizacion?.nombreComercial?.toLowerCase() || '';
      const convCode = d.convenio?.codigoConvenio?.toLowerCase() || '';
      return orgName.includes(term) || orgComercial.includes(term) || convCode.includes(term);
    });

    this.totalItems = this.filteredDeliveries.length;
    this.pageIndex = 0;
    this.updatePagination();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagination();
  }

  updatePagination(): void {
    const start = this.pageIndex * this.pageSize;
    this.paginatedDeliveries = this.filteredDeliveries.slice(start, start + this.pageSize);
    this.cdr.detectChanges();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterEstado = 'TODOS';
    this.onSearch();
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

  exportLoading = false;

  exportExcel(): void {
    this.exportLoading = true;
    this.cdr.detectChanges();

    this.service.exportExcel(this.searchTerm, this.filterEstado).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Entregas_Realizadas_BADI_${new Date().getTime()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.exportLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error exporting excel:', err);
        this.error = 'No se pudo exportar el listado a Excel.';
        this.exportLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
