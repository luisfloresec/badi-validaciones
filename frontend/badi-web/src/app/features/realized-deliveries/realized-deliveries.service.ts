import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private apiUrl = 'http://localhost:3000/realized-deliveries';

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
}
