import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

/* ──────────────────────────────────────
   Interfaces
   ────────────────────────────────────── */

interface KpiData {
  icon: string;
  value: number;
  label: string;
  description: string;
}

interface ResumenSemanal {
  icon: string;
  label: string;
  value: string;
}

interface ProximaEntrega {
  razonSocial: string;
  kilos: number;
  usuarios: number;
  cuotaRecuperacion: number;
  hora: string;
  estado: string;
}

interface AlertaGestion {
  icon: string;
  label: string;
  count: number;
}

interface ActividadReciente {
  icon: string;
  tipo: string;
  detalle: string;
}

/* ──────────────────────────────────────
   Component
   ────────────────────────────────────── */

@Component({
  selector: 'app-dashboard-placeholder',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './dashboard-placeholder.html',
  styleUrl: './dashboard-placeholder.scss'
})
export class DashboardPlaceholderComponent {

  /* ── KPIs ──────────────────────────── */
  kpis: KpiData[] = [
    {
      icon: 'apartment',
      value: 1,
      label: 'Organizaciones registradas',
      description: 'Total de organizaciones registradas en el sistema.'
    },
    {
      icon: 'check_circle',
      value: 1,
      label: 'Organizaciones activas',
      description: 'Organizaciones habilitadas para gestión operativa.'
    },
    {
      icon: 'groups',
      value: 2,
      label: 'Grupos atendidos',
      description: 'Grupos beneficiarios vinculados a organizaciones.'
    },
    {
      icon: 'diversity_3',
      value: 57,
      label: 'Personas atendidas estimadas',
      description: 'Total estimado de usuarios beneficiarios.'
    }
  ];

  /* ── Resumen semanal ───────────────── */
  resumenSemanal: ResumenSemanal[] = [
    { icon: 'local_shipping', label: 'Entregas programadas', value: '4' },
    { icon: 'corporate_fare', label: 'Organizaciones por atender', value: '3' },
    { icon: 'scale', label: 'Kilos planificados', value: '420 kg' },
    { icon: 'people', label: 'Usuarios beneficiarios estimados', value: '180' }
  ];

  /* ── Próximas entregas ─────────────── */
  displayedColumns: string[] = [
    'razonSocial', 'kilos', 'usuarios', 'cuotaRecuperacion', 'hora', 'estado'
  ];

  proximasEntregas: ProximaEntrega[] = [
    {
      razonSocial: 'Fundación de Prueba BADI',
      kilos: 125,
      usuarios: 80,
      cuotaRecuperacion: 15.50,
      hora: '09:00',
      estado: 'Programada'
    },
    {
      razonSocial: 'GAD San José',
      kilos: 180,
      usuarios: 65,
      cuotaRecuperacion: 20.00,
      hora: '11:30',
      estado: 'Pendiente'
    },
    {
      razonSocial: 'Fundación Esperanza',
      kilos: 115,
      usuarios: 35,
      cuotaRecuperacion: 12.00,
      hora: '14:00',
      estado: 'Reprogramada'
    }
  ];

  /* ── Alertas de gestión ────────────── */
  alertas: AlertaGestion[] = [
    { icon: 'person_off', label: 'Organizaciones sin representante principal', count: 0 },
    { icon: 'group_off', label: 'Grupos atendidos sin dirigente', count: 0 },
    { icon: 'domain_disabled', label: 'Organizaciones sin grupos registrados', count: 1 },
    { icon: 'pending_actions', label: 'Entregas pendientes de confirmar', count: 1 },
    { icon: 'description', label: 'Convenios pendientes por completar', count: 1 }
  ];

  /* ── Actividad reciente ────────────── */
  actividadReciente: ActividadReciente[] = [
    {
      icon: 'apartment',
      tipo: 'Organización registrada',
      detalle: 'Fundación de Prueba BADI'
    },
    {
      icon: 'person_add',
      tipo: 'Representante agregado',
      detalle: 'María Fernanda Andrade Zambrano'
    },
    {
      icon: 'group_add',
      tipo: 'Grupo atendido creado',
      detalle: 'Grupo Adultos Mayores San José'
    },
    {
      icon: 'badge',
      tipo: 'Dirigente registrado',
      detalle: 'Rosa Elena Cachimuel Flores'
    },
    {
      icon: 'local_shipping',
      tipo: 'Entrega programada',
      detalle: 'Fundación de Prueba BADI'
    }
  ];

  /* ── Helpers ───────────────────────── */
  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      'Programada': 'estado-programada',
      'Pendiente': 'estado-pendiente',
      'Completada': 'estado-completada',
      'Cancelada': 'estado-cancelada',
      'Reprogramada': 'estado-reprogramada'
    };
    return map[estado] || '';
  }
}
