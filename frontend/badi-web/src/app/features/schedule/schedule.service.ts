import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';

export interface ScheduledDelivery {
  id: string;
  convenio: {
    id: string;
    codigoConvenio?: string;
    fechaInicio?: string;
    fechaActivacion?: string;
    fechaFinEstimada?: string;
    retirosRealizados?: number;
    estado: string;
    organizacion?: {
      id: string;
      razonSocial?: string;
      nombreComercial?: string;
    };
    tipoConvenio?: {
      id: string;
      nombre: string;
      duracionMeses?: number | null;
      maxRetiros?: number | null;
    };
  };
  fechaProgramada: string;
  fechaOriginal?: string;
  descripcion?: string;
  observaciones?: string;
  motivoCancelacion?: string;
  motivoReprogramacion?: string;
  estado: string;
  fechaCreacion: string;
  fechaActualizacion?: string;
}

export interface ScheduleStats {
  programadasEsteMes: number;
  pendientesEstaSemana: number;
  canceladasEsteMes: number;
  conveniosActivos: number;
  conveniosProximosAVencer: number;
  conveniosAlLimiteRetiros: number;
}

export interface CreateScheduledDeliveryDto {
  agreementId: string;
  fechaProgramada: string;
  descripcion?: string;
  observaciones?: string;
}

export interface ScheduleFilters {
  from?: string;
  to?: string;
  agreementId?: string;
  organizationId?: string;
  estado?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private apiUrl = `${API_BASE_URL}/schedules`;

  constructor(private http: HttpClient) {}

  getAll(filters?: ScheduleFilters): Observable<ScheduledDelivery[]> {
    let params = new HttpParams();
    if (filters?.from) params = params.set('from', filters.from);
    if (filters?.to) params = params.set('to', filters.to);
    if (filters?.agreementId) params = params.set('agreementId', filters.agreementId);
    if (filters?.organizationId) params = params.set('organizationId', filters.organizationId);
    if (filters?.estado) params = params.set('estado', filters.estado);
    return this.http.get<ScheduledDelivery[]>(this.apiUrl, { params });
  }

  getStats(): Observable<ScheduleStats> {
    return this.http.get<ScheduleStats>(`${this.apiUrl}/stats`);
  }

  create(dto: CreateScheduledDeliveryDto): Observable<ScheduledDelivery> {
    return this.http.post<ScheduledDelivery>(this.apiUrl, dto);
  }

  // --- Preparados para fases futuras (no usados en Fase 2A) ---

  getById(id: string): Observable<ScheduledDelivery> {
    return this.http.get<ScheduledDelivery>(`${this.apiUrl}/${id}`);
  }

  getByAgreement(agreementId: string): Observable<ScheduledDelivery[]> {
    return this.http.get<ScheduledDelivery[]>(`${this.apiUrl}/by-agreement/${agreementId}`);
  }

  update(id: string, data: { descripcion?: string; observaciones?: string }): Observable<ScheduledDelivery> {
    return this.http.patch<ScheduledDelivery>(`${this.apiUrl}/${id}`, data);
  }

  reschedule(id: string, data: { nuevaFecha: string; motivoReprogramacion: string }): Observable<ScheduledDelivery> {
    return this.http.patch<ScheduledDelivery>(`${this.apiUrl}/${id}/reschedule`, data);
  }

  cancel(id: string, data: { motivoCancelacion: string }): Observable<ScheduledDelivery> {
    return this.http.patch<ScheduledDelivery>(`${this.apiUrl}/${id}/cancel`, data);
  }
}
