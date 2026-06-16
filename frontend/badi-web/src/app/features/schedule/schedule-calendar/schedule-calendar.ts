import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  eventsLoading = false;

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
    dateClick: (info: DateClickArg) => this.onDateClick(info),
    eventClick: (info: EventClickArg) => this.onEventClick(info),
    datesSet: (info: DatesSetArg) => this.onDatesSet(info),
    events: []
  };

  constructor(
    private scheduleService: ScheduleService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
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

    this.eventsLoading = true;

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
        this.eventsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.eventsLoading = false;
        this.snackBar.open('Error al cargar entregas', 'Cerrar', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  private mapDeliveriesToEvents(deliveries: ScheduledDelivery[]): EventInput[] {
    return deliveries.map(d => {
      const orgName = d.convenio?.organizacion?.razonSocial
        || d.convenio?.organizacion?.nombreComercial
        || 'Organización';
      const desc = d.descripcion || 'Entrega programada';
      const title = `${orgName} — ${desc}`;

      let backgroundColor: string;
      let borderColor: string;
      let textColor = '#ffffff';
      let classNames: string[] = [];

      switch (d.estado) {
        case 'Programado':
          backgroundColor = '#015641';
          borderColor = '#013d2f';
          break;
        case 'Reprogramado':
          backgroundColor = '#d97706';
          borderColor = '#b45309';
          break;
        case 'Cancelado':
          backgroundColor = '#9ca3af';
          borderColor = '#6b7280';
          classNames = ['fc-event-cancelled'];
          break;
        default:
          backgroundColor = '#2563eb';
          borderColor = '#1d4ed8';
      }

      return {
        id: d.id,
        title,
        start: d.fechaProgramada,
        backgroundColor,
        borderColor,
        textColor,
        classNames,
        extendedProps: { delivery: d }
      };
    });
  }

  onDatesSet(info: DatesSetArg): void {
    this.currentFrom = this.formatDate(info.start);
    this.currentTo = this.formatDate(info.end);
    this.loadDeliveries();
  }

  onDateClick(info: DateClickArg): void {
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
        this.loadDeliveries();
        this.loadStats();
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
        this.loadDeliveries();
        this.loadStats();
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
        this.loadDeliveries();
        this.loadStats();
      }
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
