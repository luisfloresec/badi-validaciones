import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { finalize } from 'rxjs/operators';
import { AuditService, AuditLog } from '../audit.service';
import { UsersService, User } from '../../users/users.service';
import { AuditDetailComponent } from '../audit-detail/audit-detail';

@Component({
  selector: 'app-audit-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatPaginatorModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SelectModule,
    DatePickerModule
  ],
  templateUrl: './audit-list.html',
  styleUrl: './audit-list.scss'
})
export class AuditListComponent implements OnInit {

  logs: AuditLog[] = [];
  users: User[] = [];
  loading = true;
  error: string | null = null;

  modulos: string[] = ['Usuarios', 'Roles', 'Organizaciones', 'Convenios', 'Entregas', 'Cronogramas', 'Grupos Atendidos', 'Representantes', 'Dirigentes', 'Repositorio Global', 'Auth', 'Documentos', 'Tipos Documentales'];
  acciones: string[] = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'SUBIR', 'DESCARGAR', 'ERROR'];

  // Filtros
  filters = {
    search: '',
    userId: '',
    modulo: '',
    accion: '',
    fechaDesde: null as Date | null,
    fechaHasta: null as Date | null
  };

  // Stats
  stats = {
    total: 0,
    hoy: 0,
    semana: 0,
    usuariosActivos: 0,
    moduloTop: '—',
    criticas: 0
  };

  // Paginación
  total = 0;
  pageSize = 50;
  pageIndex = 0;

  constructor(
    private auditService: AuditService,
    private usersService: UsersService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadLogs();
  }

  loadUsers(): void {
    this.usersService.getAll().subscribe({
      next: (data) => {
        this.users = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading users for audit filter:', err)
    });
  }

  loadLogs(): void {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    const params: any = {
      limit: this.pageSize,
      offset: this.pageIndex * this.pageSize
    };

    if (this.filters.search) params.search = this.filters.search;
    if (this.filters.userId) params.userId = this.filters.userId;
    if (this.filters.modulo) params.modulo = this.filters.modulo;
    if (this.filters.accion) params.accion = this.filters.accion;
    if (this.filters.fechaDesde) params.fechaDesde = this.filters.fechaDesde.toISOString();
    if (this.filters.fechaHasta) params.fechaHasta = this.filters.fechaHasta.toISOString();

    this.auditService.getAuditLogs(params)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.logs = data.items || [];
          this.total = data.total || 0;
          this.calculateStats(this.logs, this.total);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading audit logs:', err);
          this.error = 'No se pudieron cargar los registros de auditoría.';
          this.logs = [];
          this.cdr.detectChanges();
        }
      });
  }

  calculateStats(logs: AuditLog[], totalCount: number): void {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

    let hoy = 0;
    let semana = 0;
    let criticas = 0;
    const userSet = new Set<string>();
    const moduloCounts: { [key: string]: number } = {};

    logs.forEach(log => {
      const logDate = new Date(log.fechaHora);
      if (logDate >= todayStart) hoy++;
      if (logDate >= weekStart) semana++;

      const acc = (log.accion || '').toUpperCase();
      if (acc.includes('DELETE') || acc.includes('ANULAR') || acc.includes('ERROR') || acc.includes('BLOCK')) {
        criticas++;
      }

      if (log.user?.id) userSet.add(log.user.id);

      const mod = log.modulo || 'Otros';
      moduloCounts[mod] = (moduloCounts[mod] || 0) + 1;
    });

    let topMod = '—';
    let maxCount = 0;
    Object.keys(moduloCounts).forEach(m => {
      if (moduloCounts[m] > maxCount) {
        maxCount = moduloCounts[m];
        topMod = m;
      }
    });

    this.stats = {
      total: totalCount,
      hoy,
      semana,
      usuariosActivos: userSet.size,
      moduloTop: topMod,
      criticas
    };
  }

  applyFilters(): void {
    this.pageIndex = 0;
    this.loadLogs();
  }

  clearFilters(): void {
    this.filters = { search: '', userId: '', modulo: '', accion: '', fechaDesde: null, fechaHasta: null };
    this.pageIndex = 0;
    this.loadLogs();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.loadLogs();
  }

  viewDetail(log: AuditLog): void {
    this.dialog.open(AuditDetailComponent, {
      width: '750px',
      disableClose: false,
      data: { log }
    });
  }

  getBadgeClass(accion: string): string {
    const acc = (accion || '').toUpperCase();
    if (acc.includes('CREATE') || acc.includes('SUBIR') || acc.includes('LOGIN')) return 'badge-success';
    if (acc.includes('UPDATE') || acc.includes('REEMPLAZAR')) return 'badge-info';
    if (acc.includes('DELETE') || acc.includes('ANULAR') || acc.includes('ERROR') || acc.includes('LOGOUT')) return 'badge-danger';
    return 'badge-default';
  }

  getResumen(log: AuditLog): string {
    const acc = (log.accion || '').toUpperCase();
    const ent = log.entidad || log.modulo;
    if (acc.includes('CREATE')) return `Creación en ${ent}`;
    if (acc.includes('UPDATE')) return `Modificación en ${ent}`;
    if (acc.includes('DELETE')) return `Eliminación en ${ent}`;
    if (acc.includes('LOGIN')) return `Inicio de sesión exitoso`;
    if (acc.includes('LOGOUT')) return `Cierre de sesión`;
    if (acc.includes('SUBIR')) return `Carga de archivo en ${ent}`;
    if (acc.includes('DESCARGAR')) return `Descarga en ${ent}`;
    return `Operación ${log.accion} en ${ent}`;
  }

  exportLoading = false;

  exportExcel(): void {
    this.exportLoading = true;
    this.cdr.detectChanges();

    const params: any = {};
    if (this.filters.search) params.search = this.filters.search;
    if (this.filters.userId) params.userId = this.filters.userId;
    if (this.filters.modulo) params.modulo = this.filters.modulo;
    if (this.filters.accion) params.accion = this.filters.accion;
    if (this.filters.fechaDesde) params.fechaDesde = this.filters.fechaDesde.toISOString();
    if (this.filters.fechaHasta) params.fechaHasta = this.filters.fechaHasta.toISOString();

    this.auditService.exportExcel(params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Auditoria_BADI_${new Date().getTime()}.xlsx`;
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
