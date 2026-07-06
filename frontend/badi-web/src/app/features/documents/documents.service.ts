import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';
import { DocumentType } from './document-types.service';

export interface Document {
  id: string;
  tipoDocumento: DocumentType;
  titulo: string;
  descripcion?: string;
  nombreOriginal: string;
  nombreArchivo: string;
  mimeType: string;
  extension: string;
  tamanoBytes: number;
  entidadRelacionada?: string;
  idEntidadRelacionada?: string;
  entityName?: string;
  estado: string;
  fechaDocumento?: string;
  fechaCarga: string;
  motivoReemplazo?: string;
  idDocumentoReemplazado?: string;
  observaciones?: string;
}

export interface DocumentFilters {
  search?: string;
  tipoDocumentoId?: string;
  entidadRelacionada?: string;
  idEntidadRelacionada?: string;
  entityType?: string;
  organizacionId?: string;
  convenioId?: string;
  entregaId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: string;
  mostrarAnulados?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedDocuments {
  data: Document[];
  total: number;
  page: number;
  limit: number;
}

export interface DocumentStats {
  total: number;
  activos: number;
  anulados: number;
  tiposDocumentales: number;
  imagenesEvidencias: number;
  byStatus: { estado: string; count: number }[];
  byType: { tipo: string; count: number }[];
  espacioUtilizado: number;
  totalBytes: number;
  totalDocumentos?: number;
  tamanoTotalBytes?: number;
  porTipo?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class DocumentsService {
  private apiUrl = `${API_BASE_URL}/documents`;

  constructor(private http: HttpClient) {}

  getAll(filters: DocumentFilters = {}): Observable<PaginatedDocuments> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });
    return this.http.get<PaginatedDocuments>(this.apiUrl, { params });
  }

  getStats(): Observable<DocumentStats> {
    return this.http.get<DocumentStats>(`${this.apiUrl}/stats`);
  }

  getById(id: string): Observable<Document> {
    return this.http.get<Document>(`${this.apiUrl}/${id}`);
  }

  upload(data: Record<string, string>, file: File): Observable<Document> {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && typeof value === 'string') {
        formData.append(key, value);
      }
    });
    return this.http.post<Document>(`${this.apiUrl}/upload`, formData);
  }

  replace(id: string, motivo: string, file: File): Observable<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('motivoReemplazo', motivo);
    return this.http.patch<Document>(`${this.apiUrl}/${id}/replace`, formData);
  }

  update(id: string, data: any): Observable<Document> {
    return this.http.patch<Document>(`${this.apiUrl}/${id}`, data);
  }

  deactivate(id: string): Observable<Document> {
    return this.http.patch<Document>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  annul(id: string): Observable<Document> {
    return this.http.patch<Document>(`${this.apiUrl}/${id}/annul`, {});
  }

  getDownloadUrl(id: string): string {
    return `${this.apiUrl}/${id}/download`;
  }

  getViewUrl(id: string): string {
    return `${this.apiUrl}/${id}/view`;
  }

  exportExcel(filters: DocumentFilters): Observable<Blob> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.tipoDocumentoId) params = params.set('tipoDocumentoId', filters.tipoDocumentoId);
    if (filters.entityType) params = params.set('entityType', filters.entityType);
    if (filters.organizacionId) params = params.set('organizacionId', filters.organizacionId);
    if (filters.convenioId) params = params.set('convenioId', filters.convenioId);
    if (filters.fechaDesde) params = params.set('fechaDesde', filters.fechaDesde);
    if (filters.fechaHasta) params = params.set('fechaHasta', filters.fechaHasta);
    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.mostrarAnulados) params = params.set('mostrarAnulados', 'true');

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }
}
