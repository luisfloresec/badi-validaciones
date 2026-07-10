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
import { RealizedDeliveriesService } from '../../realized-deliveries/realized-deliveries.service';
import { RealizedDelivery } from '../../realized-deliveries/realized-deliveries.service';
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
  realizedDelivery: any | null;
  checkingRealized: boolean;
  // Inline edit state
  editingField: string | null;
  editValue: string | number | null;
  saving: boolean;
}

interface DayTotals {
  count: number;
  cuota: number;
  kilos: number;
  usuarios: number;
  confirmados: number;
  pendientes: number;
  detenidos: number;
}

interface ScheduleUpdatePayload {
  cuota?: number | null;
  kilosEstimados?: number | null;
  descripcion?: string | null;
  horaProgramada?: string;
  estadoSeguimiento?: string;
}

interface RealizedDeliveryUpdatePayload {
  cuota?: number | null;
  kilosEntregados?: number;
  personasAtendidas?: number;
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
    private realizedDeliveriesService: RealizedDeliveriesService,
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
      next: (allDeliveries) => {
        const deliveries = allDeliveries.filter(d => d.estado !== 'Cancelado');
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
        realizedDelivery: null,
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
        totals: this.calculateDayTotals(rows)
      };
    });
  }

  private calculateDayTotals(rows: BoardRow[]): DayTotals {
    return rows.reduce(
      (acc, row) => {
        if (row.delivery.estado !== 'Cancelado') {
          acc.cuota += this.getCuotaTotalValue(row);
          acc.kilos += this.getKilosTotalValue(row);
          acc.usuarios += this.getUsuariosTotalValue(row);
          acc.count++;

          switch (row.delivery.estadoSeguimiento) {
            case 'Confirmado': acc.confirmados++; break;
            case 'Pendiente': acc.pendientes++; break;
            case 'Detenido': acc.detenidos++; break;
          }
        }
        return acc;
      },
      { count: 0, cuota: 0, kilos: 0, usuarios: 0, confirmados: 0, pendientes: 0, detenidos: 0 }
    );
  }

  private toNumber(value: number | string | null | undefined): number {
    if (value === null || value === undefined || value === '') return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private getCuotaTotalValue(row: BoardRow): number {
    if (row.realizedDelivery) {
      const realizedCuota = row.realizedDelivery.cuota;
      if (realizedCuota !== null && realizedCuota !== undefined) {
        return this.toNumber(realizedCuota);
      }
    }
    return this.toNumber(row.delivery.cuota);
  }

  private getKilosTotalValue(row: BoardRow): number {
    if (row.realizedDelivery) {
      return this.toNumber(row.realizedDelivery.kilosEntregados);
    }
    const kilosEstimados = row.delivery.kilosEstimados;
    if (kilosEstimados !== null && kilosEstimados !== undefined) {
      return this.toNumber(kilosEstimados);
    }
    const cuota = this.toNumber(row.delivery.cuota);
    return cuota > 0 ? Number((cuota / 0.5).toFixed(2)) : 0;
  }

  private getUsuariosTotalValue(row: BoardRow): number {
    if (row.realizedDelivery) {
      return this.toNumber(row.realizedDelivery.personasAtendidas);
    }
    return 0;
  }

  private recalculateAllTotals(): void {
    this.dayGroups = this.dayGroups.map(group => ({
      ...group,
      totals: this.calculateDayTotals(group.deliveries)
    }));
  }

  private checkRealizedDeliveries(): void {
    const editableRows = this.dayGroups.flatMap(g => g.deliveries);

    if (editableRows.length === 0) {
      return;
    }

    const requests = editableRows.map(row =>
      this.http.get<any>(`${API_BASE_URL}/realized-deliveries/by-schedule/${row.delivery.id}`).pipe(
        catchError(() => of(null))
      )
    );

    forkJoin(requests).subscribe(results => {
      results.forEach((result, i) => {
        editableRows[i].realizedDelivery = result;
        editableRows[i].checkingRealized = false;
      });
      this.recalculateAllTotals();
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
        row.editValue = row.realizedDelivery ? (row.realizedDelivery.cuota != null ? row.realizedDelivery.cuota : null)
                                             : (row.delivery.cuota != null ? row.delivery.cuota : null);
        break;
      case 'usuarios':
        row.editValue = row.realizedDelivery && row.realizedDelivery.personasAtendidas != null ? row.realizedDelivery.personasAtendidas : null;
        break;
      case 'descripcion':
        row.editValue = row.delivery.descripcion || '';
        break;
      case 'horaProgramada':
        row.editValue = row.delivery.horaProgramada || '';
        break;
    }
  }

  saveEdit(row: BoardRow): void {
    if (!row.editingField || row.saving) return;

    const field = row.editingField;
    const value = row.editValue;

    // Campos que siempre van a realizedDeliveriesService (si existe entrega realizada)
    const isRealizedUpdate = row.realizedDelivery && (field === 'cuota' || field === 'usuarios');

    if (isRealizedUpdate) {
      const payload: RealizedDeliveryUpdatePayload = {};
      if (field === 'cuota') {
        const numVal = value !== null && value !== '' ? Number(value) : null;
        if (numVal === (row.realizedDelivery.cuota ?? null)) { row.editingField = null; return; }
        payload.cuota = numVal;
      } else if (field === 'usuarios') {
        const numVal = value !== null && value !== '' ? Number(value) : 0;
        if (numVal === (row.realizedDelivery.personasAtendidas ?? null)) { row.editingField = null; return; }
        payload.personasAtendidas = numVal;
      }

      row.saving = true;
      this.realizedDeliveriesService.update(row.realizedDelivery.id, payload).subscribe({
        next: (updated) => {
          row.realizedDelivery = updated;
          row.editingField = null;
          row.saving = false;
          this.snackBar.open('Actualizado', 'Cerrar', { duration: 2000 });
          this.recalculateAllTotals();
          this.cdr.detectChanges();
        },
        error: (err) => {
          row.saving = false;
          const msg = err.error?.message || 'Error al guardar';
          this.snackBar.open(Array.isArray(msg) ? msg.join('. ') : msg, 'Cerrar', { duration: 4000 });
          this.cdr.detectChanges();
        }
      });
      return;
    }

    // Campos que van a scheduleService (horaProgramada, descripcion, y cuota si no hay realizada)
    const payload: ScheduleUpdatePayload = {};
    switch (field) {
      case 'cuota':
        const numVal = value !== null && value !== '' ? Number(value) : null;
        if (numVal === (row.delivery.cuota ?? null)) { row.editingField = null; return; }
        payload.cuota = numVal;
        if (numVal !== null) {
          payload.kilosEstimados = Number((numVal / 0.5).toFixed(2));
        } else {
          payload.kilosEstimados = null;
        }
        break;
      case 'descripcion':
        const descVal = (value as string)?.trim() || null;
        if (descVal === (row.delivery.descripcion ?? null)) { row.editingField = null; return; }
        payload.descripcion = descVal;
        break;
      case 'horaProgramada':
        const horaVal = String(value || '').trim();
        if (!horaVal) {
          this.snackBar.open('La hora es obligatoria.', 'Cerrar', { duration: 3000 });
          row.editingField = null;
          return;
        }
        if (horaVal === (row.delivery.horaProgramada ?? null)) { row.editingField = null; return; }
        payload.horaProgramada = horaVal;
        break;
    }

    row.saving = true;
    this.scheduleService.update(row.delivery.id, payload).subscribe({
      next: (updated) => {
        row.delivery = updated;
        row.editingField = null;
        row.saving = false;
        this.snackBar.open('Actualizado', 'Cerrar', { duration: 2000 });
        if (field === 'horaProgramada') {
          const group = this.dayGroups.find(g => g.deliveries.includes(row));
          if (group) {
            group.deliveries.sort((a, b) => (a.delivery.horaProgramada || '').localeCompare(b.delivery.horaProgramada || ''));
          }
        }
        this.recalculateAllTotals();
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

    const current = row.delivery.estadoSeguimiento || 'Pendiente';
    let next = 'Pendiente';
    
    if (current === 'Pendiente') next = 'Confirmado';
    else if (current === 'Confirmado') next = 'Detenido';
    else if (current === 'Detenido') next = 'Pendiente';

    const previous = current;

    row.delivery.estadoSeguimiento = next;
    row.saving = true;
    
    this.scheduleService.update(row.delivery.id, { estadoSeguimiento: next }).subscribe({
      next: (updated) => {
        row.delivery = updated;
        row.saving = false;
        this.recalculateAllTotals();
        this.snackBar.open(`Seguimiento: ${next}`, 'Cerrar', { duration: 2000 });
        this.cdr.detectChanges();
      },
      error: () => {
        row.delivery.estadoSeguimiento = previous;
        row.saving = false;
        this.snackBar.open('Error al actualizar estado de seguimiento', 'Cerrar', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  private recomputeTotalsForRow(row: BoardRow): void {
    this.recalculateAllTotals();
  }

  // ── Actions ──────────────────────────

  canRegisterDelivery(row: BoardRow): boolean {
    if (row.checkingRealized || row.realizedDelivery) return false;
    if (row.delivery.estado === 'Cancelado') return false;
    const dateStr = row.delivery.fechaProgramada.substring(0, 10);
    return this.todayStr >= dateStr;
  }

  registerDelivery(row: BoardRow): void {
    this.router.navigate(['/realized-deliveries/new'], {
      queryParams: { scheduleId: row.delivery.id, returnUrl: this.router.url }
    });
  }

  viewRealizedDelivery(row: BoardRow): void {
    if (row.realizedDelivery) {
      this.router.navigate(['/realized-deliveries', row.realizedDelivery.id], {
        queryParams: { returnUrl: this.router.url }
      });
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

  getSegmento(row: BoardRow): string {
    const segmento = (row.delivery.organizacion as any)?.segmento;
    return segmento?.nombre || segmento?.descripcion || '—';
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

  getKilosVisual(row: BoardRow): number | null {
    if (row.realizedDelivery?.kilosEntregados != null) {
      return row.realizedDelivery.kilosEntregados;
    }
    if (row.delivery.kilosEstimados != null) {
      return row.delivery.kilosEstimados;
    }
    if (row.delivery.cuota != null) {
      return row.delivery.cuota / 0.5;
    }
    return null;
  }

  getUsuariosVisual(row: BoardRow): number | null {
    if (row.realizedDelivery?.personasAtendidas != null) {
      return row.realizedDelivery.personasAtendidas;
    }
    // Users are not derived from cuota when unrealized!
    return null;
  }

  getCuotaVisual(row: BoardRow): number | null {
    if (row.realizedDelivery?.cuota != null) {
      return row.realizedDelivery.cuota;
    }
    return row.delivery.cuota != null ? row.delivery.cuota : null;
  }
}
