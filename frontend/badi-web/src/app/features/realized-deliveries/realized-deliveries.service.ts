import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';

export interface CreateRealizedDelivery {
  idEntregaProgramada: string;
  fechaRealizacion: string;
  kilosEntregados: number;
  personasAtendidas: number;
  beneficiariosAtendidos?: number;
  detalleProductos: string;
  observaciones?: string;
}

export interface RealizedDelivery {
  id: string;
  fechaRealizacion: string;
  kilosEntregados: number;
  personasAtendidas: number;
  beneficiariosAtendidos?: number;
  detalleProductos: string;
  observaciones?: string;
  estado: string;
  fechaCreacion: string;
  entregaProgramada: any;
  convenio: any;
}

@Injectable({
  providedIn: 'root'
})
export class RealizedDeliveriesService {
  private apiUrl = `${API_BASE_URL}/realized-deliveries`;

  constructor(private http: HttpClient) {}

  create(data: CreateRealizedDelivery): Observable<RealizedDelivery> {
    return this.http.post<RealizedDelivery>(this.apiUrl, data);
  }

  findAll(): Observable<RealizedDelivery[]> {
    return this.http.get<RealizedDelivery[]>(this.apiUrl);
  }

  findById(id: string): Observable<RealizedDelivery> {
    return this.http.get<RealizedDelivery>(`${this.apiUrl}/${id}`);
  }

  findByAgreement(agreementId: string): Observable<RealizedDelivery[]> {
    return this.http.get<RealizedDelivery[]>(`${this.apiUrl}/by-agreement/${agreementId}`);
  }

  findByOrganization(organizationId: string): Observable<RealizedDelivery[]> {
    return this.http.get<RealizedDelivery[]>(`${this.apiUrl}/by-organization/${organizationId}`);
  }

  downloadReport(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/report`, {
      responseType: 'blob'
    });
  }

  exportExcel(searchTerm: string, estado: string): Observable<Blob> {
    let params = new HttpParams();
    if (searchTerm) params = params.set('searchTerm', searchTerm);
    if (estado && estado !== 'TODOS') params = params.set('estado', estado);

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }
}
