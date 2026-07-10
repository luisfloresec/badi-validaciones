import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ButtonModule } from 'primeng/button';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ScheduleService, ScheduledDelivery } from '../schedule.service';
import { ScheduleFormDialogComponent } from '../schedule-form-dialog/schedule-form-dialog';
import { ScheduleDetailDialogComponent } from '../schedule-detail-dialog/schedule-detail-dialog';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../core/config/api.config';

interface DayGroup {
  dateKey: string;       // YYYY-MM-DD
  label: string;         // 'Lunes 07/07/2026'
  expanded: boolean;
  deliveries: BoardRow[];
  totals: DayTotals;
}

interface BoardRow {
  delivery: ScheduledDelivery;
  realizedDeliveryId: string | null;
  checkingRealized: boolean;
  // Inline edit state
  editingField: string | null;
  editValue: string | number | null;
  saving: boolean;
}

interface DayTotals {
  count: number;
  cuotaSum: number;
  confirmados: number;
  pendientes: number;
  detenidos: number;
}

@Component({
  selector: 'app-schedule-board',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    ButtonModule
  ],
  templateUrl: './schedule-board.html',
  styleUrls: ['./schedule-board.scss']
})
export class ScheduleBoardComponent implements OnInit {
  dayGroups: DayGroup[] = [];
  loading = true;
  error: string | null = null;

  // Week navigation
  weekStart!: Date;
  weekEnd!: Date;
  weekLabel = '';

  private todayStr = '';

  constructor(
    private scheduleService: ScheduleService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.todayStr = this.formatDate(new Date());
    this.goToCurrentWeek();
  }

  // ── Week Navigation ──────────────────

  goToCurrentWeek(): void {
    const today = new Date();
    this.weekStart = this.getMonday(today);
    this.weekEnd = this.getSunday(this.weekStart);
    this.updateWeekLabel();
    this.loadData();
  }

  previousWeek(): void {
    this.weekStart.setDate(this.weekStart.getDate() - 7);
    this.weekEnd = this.getSunday(this.weekStart);
    this.updateWeekLabel();
    this.loadData();
  }

  nextWeek(): void {
    this.weekStart.setDate(this.weekStart.getDate() + 7);
    this.weekEnd = this.getSunday(this.weekStart);
    this.updateWeekLabel();
    this.loadData();
  }

  private getMonday(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private getSunday(monday: Date): Date {
    const sun = new Date(monday);
    sun.setDate(sun.getDate() + 6);
    return sun;
  }

  private updateWeekLabel(): void {
    const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const startStr = this.weekStart.toLocaleDateString('es-EC', opts);
    const endStr = this.weekEnd.toLocaleDateString('es-EC', opts);
    this.weekLabel = `${startStr} — ${endStr}`;
  }

  // ── Data Loading ─────────────────────

  loadData(): void {
    this.loading = true;
    this.error = null;
    this.dayGroups = [];

    const from = this.formatDate(this.weekStart);
    const to = this.formatDate(this.weekEnd);

    this.scheduleService.getAll({ from, to }).subscribe({
      next: (deliveries) => {
        this.buildDayGroups(deliveries);
        this.loading = false;
        this.cdr.detectChanges();
        // Check realized deliveries in background
        this.checkRealizedDeliveries();
      },
      error: () => {
        this.error = 'Error al cargar las entregas programadas.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private buildDayGroups(deliveries: ScheduledDelivery[]): void {
    const grouped = new Map<string, ScheduledDelivery[]>();

    // Initialize all 7 days of the week
    for (let i = 0; i < 7; i++) {
      const d = new Date(this.weekStart);
      d.setDate(d.getDate() + i);
      const key = this.formatDate(d);
      grouped.set(key, []);
    }

    // Distribute deliveries
    for (const del of deliveries) {
      const dateKey = del.fechaProgramada.substring(0, 10);
      const list = grouped.get(dateKey);
      if (list) {
        list.push(del);
      } else {
        grouped.set(dateKey, [del]);
      }
    }

    // Build groups sorted by date
    const sortedKeys = Array.from(grouped.keys()).sort();
    this.dayGroups = sortedKeys.map(dateKey => {
      const items = grouped.get(dateKey)!;
      // Sort by hora
      items.sort((a, b) => (a.horaProgramada || '').localeCompare(b.horaProgramada || ''));

      const rows: BoardRow[] = items.map(d => ({
        delivery: d,
        realizedDeliveryId: null,
        checkingRealized: true,
        editingField: null,
        editValue: null,
        saving: false
      }));

      return {
        dateKey,
        label: this.formatDayLabel(dateKey),
        expanded: true,
        deliveries: rows,
        totals: this.computeTotals(items)
      };
    });
  }

  private computeTotals(items: ScheduledDelivery[]): DayTotals {
    let cuotaSum = 0;
    let confirmados = 0;
    let pendientes = 0;
    let detenidos = 0;

    for (const d of items) {
      if (d.cuota) cuotaSum += d.cuota;
      switch (d.estadoSeguimiento) {
        case 'Confirmado': confirmados++; break;
        case 'Pendiente': pendientes++; break;
        case 'Detenido': detenidos++; break;
      }
    }

    return { count: items.length, cuotaSum, confirmados, pendientes, detenidos };
  }

  private checkRealizedDeliveries(): void {
    const allRows = this.dayGroups.flatMap(g => g.deliveries);
    const editableRows = allRows.filter(r => r.delivery.estado !== 'Cancelado');

    if (editableRows.length === 0) {
      allRows.forEach(r => r.checkingRealized = false);
      this.cdr.detectChanges();
      return;
    }

    const requests = editableRows.map(row =>
      this.http.get<any>(`${API_BASE_URL}/realized-deliveries/by-schedule/${row.delivery.id}`).pipe(
        catchError(() => of(null))
      )
    );

    forkJoin(requests).subscribe(results => {
      results.forEach((result, i) => {
        editableRows[i].realizedDeliveryId = result ? result.id : null;
        editableRows[i].checkingRealized = false;
      });
      // Mark cancelled as done checking
      allRows.filter(r => r.delivery.estado === 'Cancelado').forEach(r => r.checkingRealized = false);
      this.cdr.detectChanges();
    });
  }

  // ── Day Group UI ─────────────────────

  toggleDay(group: DayGroup): void {
    group.expanded = !group.expanded;
  }

  isToday(dateKey: string): boolean {
    return dateKey === this.todayStr;
  }

  isPast(dateKey: string): boolean {
    return dateKey < this.todayStr;
  }

  // ── Inline Edit ──────────────────────

  startEdit(row: BoardRow, field: string): void {
    if (row.delivery.estado === 'Cancelado') return;
    row.editingField = field;
    switch (field) {
      case 'cuota':
        row.editValue = row.delivery.cuota ?? null;
        break;
      case 'descripcion':
        row.editValue = row.delivery.descripcion || '';
        break;
      case 'observaciones':
        row.editValue = row.delivery.observaciones || '';
        break;
    }
  }

  saveEdit(row: BoardRow): void {
    if (!row.editingField || row.saving) return;

    const field = row.editingField;
    const value = row.editValue;

    // Build payload
    const payload: Record<string, any> = {};
    switch (field) {
      case 'cuota':
        const numVal = value !== null && value !== '' ? Number(value) : undefined;
        if (numVal === row.delivery.cuota) { row.editingField = null; return; }
        payload['cuota'] = numVal;
        break;
      case 'descripcion':
        const descVal = (value as string)?.trim() || undefined;
        if (descVal === row.delivery.descripcion) { row.editingField = null; return; }
        payload['descripcion'] = descVal;
        break;
      case 'observaciones':
        const obsVal = (value as string)?.trim() || undefined;
        if (obsVal === row.delivery.observaciones) { row.editingField = null; return; }
        payload['observaciones'] = obsVal;
        break;
    }

    row.saving = true;
    this.scheduleService.update(row.delivery.id, payload).subscribe({
      next: (updated) => {
        row.delivery = updated;
        row.editingField = null;
        row.saving = false;
        this.snackBar.open('Actualizado', 'Cerrar', { duration: 2000 });
        // Recompute totals for the parent day group
        this.recomputeTotalsForRow(row);
        this.cdr.detectChanges();
      },
      error: (err) => {
        row.saving = false;
        const msg = err.error?.message || 'Error al guardar';
        this.snackBar.open(Array.isArray(msg) ? msg.join('. ') : msg, 'Cerrar', { duration: 4000 });
        this.cdr.detectChanges();
      }
    });
  }

  cancelEdit(row: BoardRow): void {
    row.editingField = null;
    row.editValue = null;
  }

  onEditKeydown(event: KeyboardEvent, row: BoardRow): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveEdit(row);
    } else if (event.key === 'Escape') {
      this.cancelEdit(row);
    }
  }

  // ── Seguimiento Quick Change ─────────

  cycleSeguimiento(row: BoardRow): void {
    if (row.delivery.estado === 'Cancelado' || row.saving) return;

    const states = ['Pendiente', 'Confirmado', 'Detenido'];
    const currentIdx = states.indexOf(row.delivery.estadoSeguimiento);
    const nextState = states[(currentIdx + 1) % states.length];

    const oldState = row.delivery.estadoSeguimiento;
    row.delivery.estadoSeguimiento = nextState;
    row.saving = true;

    this.scheduleService.update(row.delivery.id, { estadoSeguimiento: nextState }).subscribe({
      next: (updated) => {
        row.delivery = updated;
        row.saving = false;
        this.snackBar.open(`Seguimiento: ${nextState}`, 'Cerrar', { duration: 2000 });
        this.recomputeTotalsForRow(row);
        this.cdr.detectChanges();
      },
      error: () => {
        row.delivery.estadoSeguimiento = oldState;
        row.saving = false;
        this.snackBar.open('Error al actualizar seguimiento', 'Cerrar', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  private recomputeTotalsForRow(row: BoardRow): void {
    for (const group of this.dayGroups) {
      if (group.deliveries.includes(row)) {
        group.totals = this.computeTotals(group.deliveries.map(r => r.delivery));
        break;
      }
    }
  }

  // ── Actions ──────────────────────────

  canRegisterDelivery(row: BoardRow): boolean {
    if (row.checkingRealized || row.realizedDeliveryId) return false;
    if (row.delivery.estado === 'Cancelado') return false;
    const dateStr = row.delivery.fechaProgramada.substring(0, 10);
    return this.todayStr >= dateStr;
  }

  registerDelivery(row: BoardRow): void {
    this.router.navigate(['/realized-deliveries/new'], {
      queryParams: { scheduleId: row.delivery.id }
    });
  }

  viewRealizedDelivery(row: BoardRow): void {
    if (row.realizedDeliveryId) {
      this.router.navigate(['/realized-deliveries', row.realizedDeliveryId]);
    }
  }

  openDetail(row: BoardRow): void {
    const dialogRef = this.dialog.open(ScheduleDetailDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false,
      data: { id: row.delivery.id }
    });

    dialogRef.afterClosed().subscribe(hasChanges => {
      if (hasChanges) {
        setTimeout(() => {
          this.loadData();
        }, 0);
      }
    });
  }

  openScheduleForm(): void {
    const dialogRef = this.dialog.open(ScheduleFormDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      disableClose: true,
      data: { fecha: new Date() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        setTimeout(() => {
          this.loadData();
        }, 0);
      }
    });
  }

  // ── Helpers ──────────────────────────

  getOrgName(d: ScheduledDelivery): string {
    return d.organizacion?.razonSocial || d.organizacion?.nombreComercial || 'Organización';
  }

  getConvenioCode(d: ScheduledDelivery): string {
    return d.convenio?.codigoConvenio || 'Sin convenio';
  }

  getSeguimientoClass(estado: string): string {
    switch (estado) {
      case 'Confirmado': return 'seg-confirmado';
      case 'Pendiente': return 'seg-pendiente';
      case 'Detenido': return 'seg-detenido';
      default: return 'seg-pendiente';
    }
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Programado': return 'est-programado';
      case 'Reprogramado': return 'est-reprogramado';
      case 'Cancelado': return 'est-cancelado';
      default: return '';
    }
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private formatDayLabel(dateKey: string): string {
    const parts = dateKey.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = dayNames[d.getDay()];
    const dd = parts[2];
    const mm = parts[1];
    const yyyy = parts[0];
    return `${dayName} ${dd}/${mm}/${yyyy}`;
  }
}
