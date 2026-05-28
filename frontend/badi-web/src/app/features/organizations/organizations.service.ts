import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

/** Respuesta de GET /organizations */
export interface OrganizationSummary {
  id: string;
  ruc: string;
  razonSocial: string;
  nombreComercial: string | null;
  email: string | null;
  ciudad: string;
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
  cedula: string | null;
  telefono: string | null;
  email: string | null;
  cargo: string | null;
  esPrincipal: boolean;
  estado: string;
  fechaRegistro: string;
  fechaActualizacion: string | null;
}

/** Grupo atendido dentro de full-detail */
export interface GrupoAtendidoDetail {
  id: string;
  nombre: string;
  grupoEtario: CatalogRef;
  vulnerabilidad: CatalogRef;
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
  documentos: any[];
}

/* ──────────────────────────────────────
   Service
   ────────────────────────────────────── */

@Injectable({ providedIn: 'root' })
export class OrganizationsService {

  private readonly apiUrl = 'http://localhost:3000/organizations';

  constructor(private http: HttpClient) {}

  getAll(): Observable<OrganizationSummary[]> {
    return this.http.get<OrganizationSummary[]>(this.apiUrl);
  }

  getFullDetail(id: string): Observable<OrganizationFullDetail> {
    return this.http.get<OrganizationFullDetail>(`${this.apiUrl}/${id}/full-detail`);
  }
}
