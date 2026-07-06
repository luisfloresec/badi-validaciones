import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';

export interface AuditLog {
  id: string;
  userId?: string;
  userIp?: string;
  userAgent?: string;
  modulo: string;
  entidad: string;
  entidadId?: string;
  accion: string;
  datosAnteriores?: any;
  datosNuevos?: any;
  resultado?: string;
  fechaHora: Date;
  user?: {
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
  };
  showDetails?: boolean;
}

export interface AuditResponse {
  items: AuditLog[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private apiUrl = `${API_BASE_URL}/audit`;

  constructor(private http: HttpClient) {}

  getAuditLogs(params?: any): Observable<AuditResponse> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<AuditResponse>(this.apiUrl, { params: httpParams });
  }

  exportExcel(params?: any): Observable<Blob> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get(`${this.apiUrl}/export`, {
      params: httpParams,
      responseType: 'blob'
    });
  }
}
