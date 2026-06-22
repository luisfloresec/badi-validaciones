import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    nombres: string;
    apellidos: string;
    roles: { nombre: string; perfilAcceso: string }[];
    requiereCambioPassword?: boolean;
  };
}

export interface UserProfile {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  cedula: string | null;
  telefono: string | null;
  roles: { nombre: string; perfilAcceso: string }[];
  requiereCambioPassword?: boolean;
  estado?: string;
}

interface JwtPayload {
  sub: string;
  email: string;
  nombres: string;
  apellidos: string;
  roles: { nombre: string; perfilAcceso: string }[];
  exp: number;
  iat: number;
}

const TOKEN_KEY = 'badi_token';
const USER_KEY = 'badi_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth';
  private currentUserSubject = new BehaviorSubject<LoginResponse['user'] | null>(this.getStoredUser());
  
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        localStorage.setItem(TOKEN_KEY, response.access_token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = this.decodeToken(token);
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  getCurrentUser(): LoginResponse['user'] | null {
    return this.currentUserSubject.value;
  }

  hasRole(roleName: string): boolean {
    const user = this.getCurrentUser();
    if (!user?.roles) return false;
    return user.roles.some(role => role.nombre === roleName || role.perfilAcceso === roleName);
  }

  hasAnyRole(...roleNames: string[]): boolean {
    const user = this.getCurrentUser();
    if (!user?.roles) return false;
    return roleNames.some(roleName => 
      user.roles.some(role => role.nombre === roleName || role.perfilAcceso === roleName)
    );
  }

  getRoles(): { nombre: string; perfilAcceso: string }[] {
    return this.getCurrentUser()?.roles ?? [];
  }

  canEdit(): boolean {
    return this.hasAnyRole('Administrador', 'Gestión Social');
  }

  getInitials(): string {
    const user = this.getCurrentUser();
    if (!user) return '??';
    const n = user.nombres?.charAt(0) || '';
    const a = user.apellidos?.charAt(0) || '';
    return `${n}${a}`.toUpperCase();
  }

  getFullName(): string {
    const user = this.getCurrentUser();
    if (!user) return '';
    return `${user.nombres} ${user.apellidos}`;
  }

  getPrimaryRole(): string {
    const roles = this.getRoles();
    return roles.length > 0 ? roles[0].nombre : 'Sin rol';
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/change-password`, {
      currentPassword,
      newPassword,
    });
  }

  updateProfile(data: { nombres?: string; apellidos?: string; email?: string }): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.apiUrl}/me`, data).pipe(
      tap((updatedUser) => {
        const currentUser = this.getCurrentUser();
        if (currentUser) {
          const newUser = {
            ...currentUser,
            nombres: updatedUser.nombres,
            apellidos: updatedUser.apellidos,
            email: updatedUser.email
          };
          localStorage.setItem(USER_KEY, JSON.stringify(newUser));
          this.currentUserSubject.next(newUser);
        }
      })
    );
  }

  private getStoredUser(): LoginResponse['user'] | null {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private decodeToken(token: string): JwtPayload {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }
}
