import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardService, DashboardSummary } from '../dashboard.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard-placeholder',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './dashboard-placeholder.html',
  styleUrl: './dashboard-placeholder.scss'
})
export class DashboardPlaceholderComponent implements OnInit {
  summary: DashboardSummary | null = null;
  loading = true;
  error: string | null = null;
  currentDateStr = '';
  userFullName = '';
  primaryRole = '';

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    this.currentDateStr = now.toLocaleDateString('es-ES', options);
    this.userFullName = this.authService.getFullName() || 'Usuario';
    this.primaryRole = this.authService.getPrimaryRole();

    this.loadSummary();
  }

  loadSummary(): void {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();
    
    this.dashboardService.getSummary().subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.summary = data;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Error al cargar dashboard summary:', err);
        this.ngZone.run(() => {
          this.error = 'No se pudo cargar la información del Dashboard. Verifica tu conexión al servidor.';
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
    });
  }

  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    if (!user?.roles) return false;
    return user.roles.some(r => {
      const n = (r.nombre || '').toLowerCase();
      const p = (r.perfilAcceso || '').toLowerCase();
      return n.includes('admin') || p.includes('admin');
    });
  }

  isGestionSocial(): boolean {
    const user = this.authService.getCurrentUser();
    if (!user?.roles) return false;
    return user.roles.some(r => {
      const n = (r.nombre || '').toLowerCase();
      const p = (r.perfilAcceso || '').toLowerCase();
      return n.includes('gest') || p.includes('gest') || n.includes('admin') || p.includes('admin');
    });
  }

  isAuditor(): boolean {
    const user = this.authService.getCurrentUser();
    if (!user?.roles) return false;
    return user.roles.some(r => {
      const n = (r.nombre || '').toLowerCase();
      const p = (r.perfilAcceso || '').toLowerCase();
      return n.includes('audit') || p.includes('audit') || n.includes('admin') || p.includes('admin');
    });
  }

  isStrictlyAuditor(): boolean {
    const user = this.authService.getCurrentUser();
    if (!user?.roles) return false;
    const hasAudit = user.roles.some(r => (r.nombre || '').toLowerCase().includes('audit') || (r.perfilAcceso || '').toLowerCase().includes('audit'));
    const hasOther = user.roles.some(r => {
      const n = (r.nombre || '').toLowerCase();
      const p = (r.perfilAcceso || '').toLowerCase();
      return n.includes('admin') || p.includes('admin') || n.includes('gest') || p.includes('gest');
    });
    return hasAudit && !hasOther;
  }

  formatDateOnly(dateVal: any): string {
    if (!dateVal) return '—';
    const str = String(dateVal);
    if (str.includes('-')) {
      const parts = str.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    const d = new Date(dateVal);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  formatDateTime(dateVal: any): string {
    if (!dateVal) return '—';
    const d = new Date(dateVal);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      'Programado': 'estado-programada',
      'Programada': 'estado-programada',
      'Pendiente': 'estado-pendiente',
      'Completada': 'estado-completada',
      'Completado': 'estado-completada',
      'Cancelada': 'estado-cancelada',
      'Cancelado': 'estado-cancelada',
      'Reprogramada': 'estado-reprogramada',
      'Reprogramado': 'estado-reprogramada',
      'Activo': 'estado-activa',
      'Activa': 'estado-activa',
      'Registrada': 'estado-programada',
      'Registrado': 'estado-programada',
      'Anulado': 'estado-cancelada',
      'Anulada': 'estado-cancelada',
      'Finalizado': 'estado-completada',
    };
    return map[estado] || 'estado-default';
  }

  navigateToOrg(orgId: string): void {
    this.router.navigate(['/organizations', orgId]);
  }

  navigateToAgreement(agrId: string): void {
    this.router.navigate(['/agreements', agrId]);
  }

  navigateToSchedule(): void {
    this.router.navigate(['/schedule']);
  }

  navigateToDelivery(delId: string): void {
    this.router.navigate(['/realized-deliveries', delId]);
  }

  navigateToDocs(): void {
    this.router.navigate(['/documents']);
  }

  navigateToAudit(): void {
    this.router.navigate(['/audit']);
  }

  navigateToUsers(): void {
    this.router.navigate(['/users']);
  }

  navigateToPath(path: string): void {
    this.router.navigate([path]);
  }
}
