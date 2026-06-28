import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ButtonModule } from 'primeng/button';
import { AuditLog } from '../audit.service';

@Component({
  selector: 'app-audit-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    ButtonModule
  ],
  templateUrl: './audit-detail.html',
  styleUrl: './audit-detail.scss'
})
export class AuditDetailComponent {
  log: AuditLog;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { log: AuditLog },
    private dialogRef: MatDialogRef<AuditDetailComponent>
  ) {
    this.log = data.log;
  }

  getBadgeClass(accion: string): string {
    const acc = (accion || '').toUpperCase();
    if (acc.includes('CREATE') || acc.includes('SUBIR') || acc.includes('LOGIN')) return 'badge-success';
    if (acc.includes('UPDATE') || acc.includes('REEMPLAZAR')) return 'badge-info';
    if (acc.includes('DELETE') || acc.includes('ANULAR') || acc.includes('ERROR') || acc.includes('LOGOUT')) return 'badge-danger';
    return 'badge-default';
  }

  formatData(data: any): string {
    if (!data) return '—';
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return '—';
    }
  }

  getResumen(log: AuditLog): string {
    const acc = (log.accion || '').toUpperCase();
    const ent = log.entidad || log.modulo;
    if (acc.includes('CREATE')) return `Creación de nuevo registro en ${ent}.`;
    if (acc.includes('UPDATE')) return `Modificación de registro existente en ${ent}.`;
    if (acc.includes('DELETE')) return `Eliminación o anulación de registro en ${ent}.`;
    if (acc.includes('LOGIN')) return `Inicio de sesión exitoso en el sistema.`;
    if (acc.includes('LOGOUT')) return `Cierre de sesión del usuario.`;
    if (acc.includes('SUBIR')) return `Carga de archivo al repositorio en ${ent}.`;
    if (acc.includes('DESCARGAR')) return `Descarga de documento en ${ent}.`;
    return `Operación ${log.accion} ejecutada en ${ent}.`;
  }
}
