import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FullCalendarModule, FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, EventInput, DatesSetArg, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { ScheduleService, ScheduleStats, ScheduledDelivery } from '../schedule.service';
import { ScheduleFormDialogComponent } from '../schedule-form-dialog/schedule-form-dialog';
import { ScheduleDetailDialogComponent } from '../schedule-detail-dialog/schedule-detail-dialog';
import { AuthService } from '../../../core/auth/auth.service';

interface StatCard {
  label: string;
  value: number;
  icon: string;
  color: string;
  bgColor: string;
}

@Component({
  selector: 'app-schedule-calendar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    FullCalendarModule
  ],
  templateUrl: './schedule-calendar.html',
  styleUrls: ['./schedule-calendar.scss']
})
export class ScheduleCalendarComponent implements OnInit {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  stats: ScheduleStats | null = null;
  statsLoading = true;
  eventsLoading = true;

  statCards: StatCard[] = [];

  // Rango visible del calendario
  private currentFrom = '';
  private currentTo = '';

  // FullCalendar
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: 'es',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: ''
    },
    buttonText: {
      today: 'Hoy'
    },
    height: 'auto',
    fixedWeekCount: false,
    dayMaxEvents: 3,
    displayEventTime: true,
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    eventContent: (arg) => {
      const title = arg.event.title;
      const timeText = arg.timeText;
      const estadoIcon = arg.event.extendedProps['estadoIcon'] || 'event';
      const seguimientoColor = arg.event.extendedProps['seguimientoColor'] || '#9ca3af';

      let html = `
        <div style="display:flex; width: 100%; min-height: 40px; overflow: hidden; position: relative;">
          <!-- Ícono Izquierdo -->
          <div style="display:flex; align-items:center; justify-content:center; width: 30px; flex-shrink: 0; color: #4b5563; padding-left: 2px;">
            <i class="material-icons" style="font-size: 16px;">${estadoIcon}</i>
          </div>
          
          <!-- Centro Textos -->
          <div style="display:flex; flex-direction:column; justify-content:center; flex-grow: 1; min-width: 0; padding: 4px 6px 4px 0;">
            <div style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12px; color: #1f2937;">
              ${title}
            </div>
            ${timeText ? `<div style="font-size: 11px; opacity: 0.7; margin-top: 1px; color: #4b5563;">${timeText}</div>` : ''}
          </div>

          <!-- Barra Derecha -->
          <div style="width: 5px; flex-shrink: 0; background-color: ${seguimientoColor};"></div>
        </div>
      `;
      return { html };
    },
    dateClick: (info: DateClickArg) => this.onDateClick(info),
    eventClick: (info: EventClickArg) => this.onEventClick(info),
    datesSet: (info: DatesSetArg) => this.onDatesSet(info),
    events: []
  };

  constructor(
    private scheduleService: ScheduleService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.statsLoading = true;
    this.scheduleService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.buildStatCards();
        this.statsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.statsLoading = false;
        this.snackBar.open('Error al cargar estadísticas', 'Cerrar', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  private buildStatCards(): void {
    if (!this.stats) return;
    this.statCards = [
      {
        label: 'Programadas este mes',
        value: this.stats.programadasEsteMes,
        icon: 'event',
        color: '#015641',
        bgColor: 'rgba(1, 86, 65, 0.08)'
      },
      {
        label: 'Pendientes esta semana',
        value: this.stats.pendientesEstaSemana,
        icon: 'pending_actions',
        color: '#d97706',
        bgColor: 'rgba(217, 119, 6, 0.08)'
      },
      {
        label: 'Canceladas este mes',
        value: this.stats.canceladasEsteMes,
        icon: 'event_busy',
        color: '#dc2626',
        bgColor: 'rgba(220, 38, 38, 0.06)'
      },
      {
        label: 'Convenios activos',
        value: this.stats.conveniosActivos,
        icon: 'handshake',
        color: '#015641',
        bgColor: 'rgba(1, 86, 65, 0.08)'
      },
      {
        label: 'Próximos a vencer',
        value: this.stats.conveniosProximosAVencer,
        icon: 'schedule',
        color: '#ea580c',
        bgColor: 'rgba(234, 88, 12, 0.08)'
      },
      {
        label: 'Al límite de retiros',
        value: this.stats.conveniosAlLimiteRetiros,
        icon: 'warning',
        color: '#dc2626',
        bgColor: 'rgba(220, 38, 38, 0.06)'
      }
    ];
  }

  loadDeliveries(): void {
    if (!this.currentFrom || !this.currentTo) return;

    Promise.resolve().then(() => {
      this.eventsLoading = true;
    });

    this.scheduleService.getAll({
      from: this.currentFrom,
      to: this.currentTo
    }).subscribe({
      next: (deliveries) => {
        const events = this.mapDeliveriesToEvents(deliveries);
        this.calendarOptions = {
          ...this.calendarOptions,
          events
        };
        Promise.resolve().then(() => {
          this.eventsLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        Promise.resolve().then(() => {
          this.eventsLoading = false;
          this.cdr.detectChanges();
        });
        this.snackBar.open('Error al cargar entregas', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private mapDeliveriesToEvents(deliveries: ScheduledDelivery[]): EventInput[] {
    return deliveries.map(d => {
      const orgName = d.organizacion?.razonSocial
        || d.organizacion?.nombreComercial
        || 'Organización';
      const desc = d.descripcion || 'Entrega programada';
      
      const title = `${orgName} — ${desc}`;

      let seguimientoColor: string;
      switch (d.estadoSeguimiento) {
        case 'Confirmado': seguimientoColor = '#16a34a'; break;
        case 'Pendiente': seguimientoColor = '#eab308'; break;
        case 'Detenido': seguimientoColor = '#ef4444'; break;
        default: seguimientoColor = '#9ca3af';
      }

      let estadoIcon: string;
      switch (d.estado) {
        case 'Programado': estadoIcon = 'event'; break;
        case 'Reprogramado': estadoIcon = 'update'; break;
        case 'Realizado': estadoIcon = 'check_circle'; break;
        case 'Cancelado': estadoIcon = 'cancel'; break;
        default: estadoIcon = 'event';
      }

      const backgroundColor = '#ffffff';
      const borderColor = 'transparent';
      const textColor = '#1f2937';
      let classNames = ['custom-badi-event'];

      if (d.estado === 'Cancelado') {
        classNames.push('fc-event-cancelled');
      }

      const startTime = d.horaProgramada ? `${d.fechaProgramada}T${d.horaProgramada}:00` : d.fechaProgramada;

      return {
        id: d.id,
        title,
        start: startTime,
        backgroundColor,
        borderColor,
        textColor,
        classNames,
        extendedProps: { delivery: d, seguimientoColor, estadoIcon }
      };
    });
  }

  onDatesSet(info: DatesSetArg): void {
    this.currentFrom = this.formatDate(info.start);
    this.currentTo = this.formatDate(info.end);
    this.loadDeliveries();
  }

  onDateClick(info: DateClickArg): void {
    if (!this.authService.canEdit()) return;
    
    // Parsear la fecha seleccionada en zona local para evitar desfases
    const parts = info.dateStr.split('-');
    const selectedDate = new Date(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10)
    );

    const dialogRef = this.dialog.open(ScheduleFormDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      disableClose: true,
      data: { fecha: selectedDate }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.refreshCalendarSafely();
      }
    });
  }

  onEventClick(info: EventClickArg): void {
    info.jsEvent.preventDefault();
    const delivery = info.event.extendedProps['delivery'] as ScheduledDelivery;
    
    const dialogRef = this.dialog.open(ScheduleDetailDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false,
      data: { id: delivery.id }
    });

    dialogRef.afterClosed().subscribe(hasChanges => {
      if (hasChanges) {
        this.refreshCalendarSafely();
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
        this.refreshCalendarSafely();
      }
    });
  }

  private refreshCalendarSafely(): void {
    setTimeout(() => {
      this.loadDeliveries();
      this.loadStats();
    }, 0);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
