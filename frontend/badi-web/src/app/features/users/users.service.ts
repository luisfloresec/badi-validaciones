import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  estado: string;
  roles?: { id: string; nombre: string }[];
  fechaRegistro?: Date;
  fechaActualizacion?: Date;
}

export interface CreateUserDto {
  nombres: string;
  apellidos: string;
  email: string;
  password?: string;
  roleIds: string[];
}

export interface UpdateUserDto {
  nombres?: string;
  apellidos?: string;
  email?: string;
  password?: string;
  roleIds?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = 'http://localhost:3000/users';

  constructor(private http: HttpClient) {}

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  create(user: CreateUserDto): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  update(id: string, user: UpdateUserDto): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, user);
  }

  deactivate(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/deactivate`, {});
  }
}
