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
import { RealizedDeliveriesService, RealizedDelivery } from '../realized-deliveries.service';

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
    MatCardModule
  ],
  templateUrl: './realized-deliveries-list.html',
  styleUrls: ['./realized-deliveries-list.scss']
})
export class RealizedDeliveriesListComponent implements OnInit {
  deliveries: RealizedDelivery[] = [];
  filteredDeliveries: RealizedDelivery[] = [];
  isLoading = true;
  error: string | null = null;
  searchTerm = '';

  constructor(
    private service: RealizedDeliveriesService,
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
        this.filteredDeliveries = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'No se pudieron cargar las entregas realizadas.';
        this.isLoading = false;
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }

  onSearch(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredDeliveries = this.deliveries;
      return;
    }

    this.filteredDeliveries = this.deliveries.filter(d => {
      const orgName = d.convenio?.organizacion?.razonSocial?.toLowerCase() || '';
      const orgComercial = d.convenio?.organizacion?.nombreComercial?.toLowerCase() || '';
      const convCode = d.convenio?.codigoConvenio?.toLowerCase() || '';
      return orgName.includes(term) || orgComercial.includes(term) || convCode.includes(term);
    });
  }
}
