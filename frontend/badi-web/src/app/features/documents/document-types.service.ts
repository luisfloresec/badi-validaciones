import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DocumentType {
  id: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
  requiereEntidadRelacionada: boolean;
  entidadesPermitidas: string[];
  permiteCargaGeneral: boolean;
  requiereFechaDocumento: boolean;
  observacionesObligatorias: boolean;
  extensionesPermitidas: string[];
  tamanoMaximoMb: number;
  estado: string;
}

export interface CreateDocumentTypeDto {
  nombre: string;
  codigo: string;
  descripcion?: string;
  requiereEntidadRelacionada?: boolean;
  entidadesPermitidas?: string[];
  permiteCargaGeneral?: boolean;
  requiereFechaDocumento?: boolean;
  observacionesObligatorias?: boolean;
  extensionesPermitidas?: string[];
  tamanoMaximoMb?: number;
}

export interface UpdateDocumentTypeDto extends Partial<CreateDocumentTypeDto> {}

@Injectable({
  providedIn: 'root'
})
export class DocumentTypesService {
  private apiUrl = 'http://localhost:3000/documents/types';

  constructor(private http: HttpClient) {}

  getAllActive(): Observable<DocumentType[]> {
    return this.http.get<DocumentType[]>(this.apiUrl);
  }

  getAll(): Observable<DocumentType[]> {
    return this.http.get<DocumentType[]>(`${this.apiUrl}/all`);
  }

  getById(id: string): Observable<DocumentType> {
    return this.http.get<DocumentType>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateDocumentTypeDto): Observable<DocumentType> {
    return this.http.post<DocumentType>(this.apiUrl, data);
  }

  update(id: string, data: UpdateDocumentTypeDto): Observable<DocumentType> {
    return this.http.patch<DocumentType>(`${this.apiUrl}/${id}`, data);
  }

  deactivate(id: string): Observable<DocumentType> {
    return this.http.patch<DocumentType>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  activate(id: string): Observable<DocumentType> {
    return this.http.patch<DocumentType>(`${this.apiUrl}/${id}/activate`, {});
  }
}
