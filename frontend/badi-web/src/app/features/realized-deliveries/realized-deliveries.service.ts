import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';

export interface OrganizacionRef {
  id: string;
  razonSocial?: string;
  nombreComercial?: string;
  nombre?: string;
  segmento?: {
    id?: string;
    nombre?: string;
    descripcion?: string;
    valor?: string;
  } | null;
}

export interface ConvenioRef {
  id: string;
  codigoConvenio?: string;
  estado?: string;
  retirosRealizados?: number;
  tipoConvenio?: {
    id?: string;
    nombre?: string;
    maxRetiros?: number;
  };
  organizacion?: OrganizacionRef;
}

export interface EntregaProgramadaRef {
  id: string;
  fechaProgramada?: string;
  horaProgramada?: string;
  estado?: string;
  descripcion?: string;
  observaciones?: string;
  cuota?: number;
  kilosEstimados?: number;
  estadoSeguimiento?: string;
  organizacion?: OrganizacionRef | null;
  convenio?: ConvenioRef | null;
}

export interface CreateRealizedDelivery {
  idEntregaProgramada: string;
  fechaRealizacion: string;
  cuota: number;
  kilosEntregados?: number;
  personasAtendidas: number;
  beneficiariosAtendidos?: number;
  detalleProductos?: string;
  observaciones?: string;
}

export interface RealizedDelivery {
  id: string;
  fechaRealizacion: string;
  cuota?: number | null;
  kilosEntregados: number;
  personasAtendidas: number;
  beneficiariosAtendidos?: number | null;
  detalleProductos?: string | null;
  observaciones?: string | null;
  estado: string;
  fechaCreacion: string;
  organizacion?: OrganizacionRef | null;
  convenio?: ConvenioRef | null;
  entregaProgramada?: EntregaProgramadaRef | null;
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

  update(id: string, data: Partial<RealizedDelivery>): Observable<RealizedDelivery> {
    return this.http.patch<RealizedDelivery>(`${this.apiUrl}/${id}`, data);
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
