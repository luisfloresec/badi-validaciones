import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private readonly apiUrl = 'http://localhost:3000/dashboard';

  constructor(private http: HttpClient) {}

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiUrl}/summary`);
  }

  downloadReport(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/report`, {
      responseType: 'blob'
    });
  }
}
