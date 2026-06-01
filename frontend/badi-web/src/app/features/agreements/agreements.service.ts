import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AgreementType {
  id: string;
  nombre: string;
  descripcion: string;
  estado: string;
}

export interface Agreement {
  id: string;
  organizacion: { id: string; razonSocial?: string; nombreComercial?: string; ruc?: string };
  tipoConvenio: AgreementType;
  codigoConvenio?: string;
  fechaInicio?: string;
  fechaCreacion: string;
  observaciones?: string;
  estado: string;
}

export interface CreateAgreementDto {
  organizationId: string;
  tipoConvenioId: string;
  codigoConvenio?: string;
  fechaInicio?: string;
  observaciones?: string;
}

export interface UpdateAgreementDto {
  tipoConvenioId?: string;
  codigoConvenio?: string;
  fechaInicio?: string;
  observaciones?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AgreementsService {
  private apiUrl = 'http://localhost:3000/agreements';

  constructor(private http: HttpClient) {}

  getTypes(): Observable<AgreementType[]> {
    return this.http.get<AgreementType[]>(`${this.apiUrl}/types`);
  }

  getAll(): Observable<Agreement[]> {
    return this.http.get<Agreement[]>(this.apiUrl);
  }

  getById(id: string): Observable<Agreement> {
    return this.http.get<Agreement>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateAgreementDto): Observable<Agreement> {
    return this.http.post<Agreement>(this.apiUrl, data);
  }

  update(id: string, data: UpdateAgreementDto): Observable<Agreement> {
    return this.http.patch<Agreement>(`${this.apiUrl}/${id}`, data);
  }

  deactivate(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/deactivate`, {});
  }
}
