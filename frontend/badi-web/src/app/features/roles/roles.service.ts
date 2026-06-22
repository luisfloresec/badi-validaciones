import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Role {
  id: string;
  nombre: string;
  descripcion?: string;
  perfilAcceso: string;
  estado: string;
  fechaCreacion: string;
  fechaActualizacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  private apiUrl = 'http://localhost:3000/roles';

  constructor(private http: HttpClient) {}

  getAllActive(): Observable<Role[]> {
    return this.http.get<Role[]>(this.apiUrl);
  }

  getAll(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/all`);
  }

  create(data: { nombre: string; descripcion?: string; perfilAcceso: string }): Observable<Role> {
    return this.http.post<Role>(this.apiUrl, data);
  }

  update(id: string, data: { nombre?: string; descripcion?: string; perfilAcceso?: string }): Observable<Role> {
    return this.http.patch<Role>(`${this.apiUrl}/${id}`, data);
  }

  deactivate(id: string): Observable<Role> {
    return this.http.patch<Role>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  activate(id: string): Observable<Role> {
    return this.http.patch<Role>(`${this.apiUrl}/${id}/activate`, {});
  }
}
