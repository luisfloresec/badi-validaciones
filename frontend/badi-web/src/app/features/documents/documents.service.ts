import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  byStatus: { estado: string; count: number }[];
  byType: { tipo: string; count: number }[];
  totalBytes: number;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentsService {
  private apiUrl = 'http://localhost:3000/documents';

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
      // Only append non-empty, plain string values
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
}
