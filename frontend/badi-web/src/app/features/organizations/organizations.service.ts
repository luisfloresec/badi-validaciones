import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';

/* ──────────────────────────────────────
   Interfaces — alineadas al backend
   ────────────────────────────────────── */

export interface CatalogRef {
  id: string;
  nombre: string;
  tipoCatalogo: string;
  estado: string;
}

export interface OrganizationTypeRef {
  id: string;
  nombre: string;
  descripcion: string;
  estado: string;
}

export interface ProvinceRef {
  id: string;
  nombre: string;
  estado: string;
}

export interface CityRef {
  id: string;
  nombre: string;
  estado: string;
}

/** Respuesta de GET /organizations */
export interface OrganizationSummary {
  id: string;
  ruc: string;
  razonSocial: string;
  nombreComercial: string | null;
  email: string | null;
  ciudad: string; // Legacy
  provincia?: ProvinceRef | null;
  ciudadCatalogo?: CityRef | null;
  sectorBarrio: string | null;
  direccion: string;
  referenciaDireccion: string | null;
  cuotaRecuperacionEstimada: string | number | null;
  totalPersonasAtendidas: number;
  redesSociales: Record<string, any> | null;
  observaciones: string | null;
  estado: string;
  fechaRegistro: string;
  fechaActualizacion: string | null;
  tipoOrganizacion: OrganizationTypeRef;
  accionSocial: CatalogRef;
  segmento: CatalogRef;
  frecuenciaRetiro: CatalogRef | null;
  transporte: CatalogRef | null;
}

/** Representante dentro de full-detail */
export interface RepresentanteDetail {
  id: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  telefono: string;
  email: string;
  cargo: string;
  esPrincipal: boolean;
  estado: string;
  fechaRegistro: string;
  fechaActualizacion: string | null;
}

export interface AgreementDetail {
  id: string;
  codigoConvenio?: string;
  tipoConvenio: { id: string; nombre: string; descripcion: string; duracionMeses?: number | null; maxRetiros?: number | null; estado: string };
  estado: string;
  fechaInicio?: string;
  fechaActivacion?: string;
  fechaFinEstimada?: string;
  fechaFinalizacion?: string;
  retirosRealizados?: number;
  fechaCreacion: string;
  observaciones?: string;
  convenioOrigenId?: string | null;
  motivoCambio?: string | null;
}

/** Grupo atendido dentro de full-detail */
export interface GrupoAtendidoDetail {
  id: string;
  nombre: string;
  grupoEtario: CatalogRef;
  vulnerabilidad: CatalogRef;
  vulnerabilidades: CatalogRef[];
  numeroPersonas: number;
  observaciones: string | null;
  estado: string;
  fechaRegistro: string;
  fechaActualizacion: string | null;
}

/** Dirigente dentro de full-detail */
export interface DirigenteDetail {
  id: string;
  representanteId: string | null;
  nombres: string;
  apellidos: string;
  cedula: string | null;
  telefono: string | null;
  email: string | null;
  estado: string;
  fechaRegistro: string;
  fechaActualizacion: string | null;
}

/** Grupo + dirigentes en full-detail */
export interface GrupoConDirigentes {
  grupo: GrupoAtendidoDetail;
  dirigentes: DirigenteDetail[];
}

/** Respuesta de GET /organizations/:id/full-detail */
export interface OrganizationFullDetail {
  organizacion: OrganizationSummary;
  representantes: RepresentanteDetail[];
  gruposAtendidos: GrupoConDirigentes[];
  convenios?: AgreementDetail[];
  documentos: any[];
}

/* ──────────────────────────────────────
   Service
   ────────────────────────────────────── */

@Injectable({ providedIn: 'root' })
export class OrganizationsService {

  private readonly apiUrl = `${API_BASE_URL}/organizations`;
  private readonly catalogUrl = `${API_BASE_URL}/catalogs`;
  private readonly typesUrl = `${API_BASE_URL}/organization-types`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista de organizaciones activas y registradas.
   */
  getAll(includeInactive: boolean = false): Observable<OrganizationSummary[]> {
    let params = new HttpParams();
    if (includeInactive) {
      params = params.set('includeInactive', 'true');
    }
    return this.http.get<OrganizationSummary[]>(this.apiUrl, { params });
  }

  /**
   * Obtiene el detalle completo de una organización.
   */
  getFullDetail(id: string): Observable<OrganizationFullDetail> {
    return this.http.get<OrganizationFullDetail>(`${this.apiUrl}/${id}/full-detail`);
  }

  getOrganizationTypes(): Observable<OrganizationTypeRef[]> {
    return this.http.get<OrganizationTypeRef[]>(this.typesUrl);
  }

  getCatalogsByType(tipoCatalogo: string): Observable<CatalogRef[]> {
    return this.http.get<CatalogRef[]>(`${this.catalogUrl}/type/${tipoCatalogo}`);
  }

  createOrganization(payload: any): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(this.apiUrl, payload);
  }

  updateOrganization(id: string, payload: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, payload);
  }

  deactivateOrganization(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/deactivate`, {});
  }

  activateOrganization(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/activate`, {});
  }

  replaceRepresentative(id: string, payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/representatives/replace`, payload);
  }

  updateRepresentative(id: string, payload: any): Observable<any> {
    return this.http.patch(`${API_BASE_URL}/representatives/${id}`, payload);
  }

  createAttendedGroupWithLeader(organizationId: string, payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${organizationId}/attended-groups/with-leader`, payload);
  }

  updateAttendedGroup(groupId: string, payload: any): Observable<any> {
    return this.http.patch(`${API_BASE_URL}/attended-groups/${groupId}`, payload);
  }

  deactivateAttendedGroup(groupId: string): Observable<any> {
    return this.http.patch(`${API_BASE_URL}/attended-groups/${groupId}/deactivate`, {});
  }

  // --- DIRIGENTES ---

  updateLeader(leaderId: string, payload: any): Observable<any> {
    return this.http.patch(`${API_BASE_URL}/leaders/${leaderId}`, payload);
  }

  deactivateLeader(leaderId: string): Observable<any> {
    return this.http.patch(`${API_BASE_URL}/leaders/${leaderId}/deactivate`, {});
  }

  replaceLeader(groupId: string, payload: any): Observable<any> {
    return this.http.post(`${API_BASE_URL}/attended-groups/${groupId}/leaders/replace`, payload);
  }

  downloadReport(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/report`, {
      responseType: 'blob'
    });
  }

  downloadHistoryReport(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/history`, {
      responseType: 'blob'
    });
  }

  exportExcel(searchTerm: string, filterEstado: string, filterTipo: string): Observable<Blob> {
    let params = new HttpParams();
    if (searchTerm) params = params.set('searchTerm', searchTerm);
    if (filterEstado) params = params.set('estado', filterEstado);
    if (filterTipo) params = params.set('tipoOrganizacion', filterTipo);

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }
}
