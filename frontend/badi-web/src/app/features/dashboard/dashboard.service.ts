import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';

export interface DashboardSummary {
  resumen: {
    organizacionesRegistradas: number;
    conveniosActivos: number;
    entregasProgramadasMes: number;
    entregasRealizadasMes: number;
    kilosEntregadosMes: number;
    documentosActivos: number;
    usuariosActivos: number;
  };
  convenios: {
    registrados: number;
    activos: number;
    finalizados: number;
    anulados: number;
    porVencer: any[];
    porEstado: { estado: string; count: number; color: string }[];
  };
  cronograma: {
    programadasHoy: any[];
    proximasEntregas: any[];
    reprogramadas: number;
    canceladasMes: number;
  };
  entregas: {
    totalMes: number;
    kilosMes: number;
    ultimasEntregas: any[];
  };
  documentos: {
    total: number;
    activos: number;
    anulados: number;
    porTipo: { tipo: string; count: number }[];
    ultimosDocumentos: any[];
  };
  auditoria: {
    actividadReciente: any[];
  };
  alertas: {
    icon: string;
    label: string;
    count: number;
    link: string;
  }[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly apiUrl = `${API_BASE_URL}/dashboard`;

  constructor(private http: HttpClient) {}

  getSummary(startDate?: string, endDate?: string): Observable<DashboardSummary> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<DashboardSummary>(`${this.apiUrl}/summary`, { params });
  }

  downloadReport(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/report`, {
      responseType: 'blob'
    });
  }
}
