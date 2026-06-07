import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AgreementType {
  id: string;
  nombre: string;
  descripcion: string;
  duracionMeses: number | null;
  maxRetiros: number | null;
  estado: string;
}

export interface Agreement {
  id: string;
  organizacion: { id: string; razonSocial?: string; nombreComercial?: string; ruc?: string };
  tipoConvenio: AgreementType;
  codigoConvenio?: string;
  fechaInicio?: string;
  fechaActivacion?: string;
  fechaFinEstimada?: string;
  fechaFinalizacion?: string;
  retirosRealizados?: number;
  fechaCreacion: string;
  observaciones?: string;
  estado: string;
  convenioOrigenId?: string | null;
  motivoCambio?: string | null;
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

  getAllTypes(): Observable<AgreementType[]> {
    return this.http.get<AgreementType[]>(`${this.apiUrl}/types/all`);
  }

  getTypeById(id: string): Observable<AgreementType> {
    return this.http.get<AgreementType>(`${this.apiUrl}/types/${id}`);
  }

  createType(data: any): Observable<AgreementType> {
    return this.http.post<AgreementType>(`${this.apiUrl}/types`, data);
  }

  updateType(id: string, data: any): Observable<AgreementType> {
    return this.http.patch<AgreementType>(`${this.apiUrl}/types/${id}`, data);
  }

  deactivateType(id: string): Observable<AgreementType> {
    return this.http.patch<AgreementType>(`${this.apiUrl}/types/${id}/deactivate`, {});
  }

  activateType(id: string): Observable<AgreementType> {
    return this.http.patch<AgreementType>(`${this.apiUrl}/types/${id}/activate`, {});
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

  activate(id: string): Observable<Agreement> {
    return this.http.patch<Agreement>(`${this.apiUrl}/${id}/activate`, {});
  }

  finalize(id: string, motivo?: string): Observable<Agreement> {
    return this.http.patch<Agreement>(`${this.apiUrl}/${id}/finalize`, { motivo });
  }

  deactivate(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/deactivate`, {});
  }
}
