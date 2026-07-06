import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface Province {
  id: string;
  nombre: string;
  codigo?: string;
  estado: string;
}

export interface City {
  id: string;
  nombre: string;
  estado: string;
}

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly baseUrl = `${API_BASE_URL}/locations`;

  constructor(private http: HttpClient) {}

  getProvinces(): Observable<Province[]> {
    return this.http.get<Province[]>(`${this.baseUrl}/provinces`);
  }

  getCitiesByProvince(provinceId: string): Observable<City[]> {
    return this.http.get<City[]>(`${this.baseUrl}/provinces/${provinceId}/cities`);
  }
}
