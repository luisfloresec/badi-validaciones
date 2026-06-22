import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { finalize } from 'rxjs/operators';
import { AuditService, AuditLog } from '../audit.service';

@Component({
  selector: 'app-audit-list',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatPaginatorModule
  ],
  templateUrl: './audit-list.html',
  styleUrl: './audit-list.scss'
})
export class AuditListComponent implements OnInit {

  logs: AuditLog[] = [];
  loading = true;
  error: string | null = null;
  total = 0;
  pageSize = 50;
  pageIndex = 0;

  constructor(
    private auditService: AuditService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.error = null;

    this.auditService.getAuditLogs({ limit: this.pageSize, offset: this.pageIndex * this.pageSize })
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.logs = data.items || [];
          this.total = data.total || 0;
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

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.loadLogs();
  }

  getBadgeClass(accion: string): string {
    switch(accion) {
      case 'CREATE': return 'badge-create';
      case 'UPDATE': return 'badge-update';
      case 'DELETE': return 'badge-delete';
      default: return 'badge-default';
    }
  }

  formatData(data: any): string {
    if (!data) return '—';
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return '—';
    }
  }

  toggleDetails(log: any): void {
    log.showDetails = !log.showDetails;
  }
}
