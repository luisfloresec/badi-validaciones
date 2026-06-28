import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [MatToolbarModule, MatIconModule, MatButtonModule, MenuModule, RouterModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss'
})
export class TopbarComponent implements OnInit, OnDestroy {

  currentTitle = 'Panel de Control';
  profileItems: MenuItem[] = [];

  private readonly routeTitleMap: Record<string, string> = {
    '/dashboard': 'Panel de Control',
    '/organizations': 'Organizaciones',
    '/agreements': 'Convenios',
    '/users': 'Usuarios',
    '/roles': 'Roles',
    '/documents': 'Repositorio Global',
    '/schedule': 'Cronograma',
    '/realized-deliveries': 'Entregas',
    '/audit': 'Auditoría',
    '/profile': 'Administrar Perfil'
  };

  private routerSub?: Subscription;

  constructor(
    private router: Router,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Definir ítems del menú de usuario usando PrimeNG Menu con navegación absoluta
    this.profileItems = [
      {
        label: 'Administrar perfil',
        icon: 'pi pi-user',
        command: () => {
          this.router.navigate(['/profile']);
        }
      },
      {
        label: 'Cerrar sesión',
        icon: 'pi pi-sign-out',
        command: () => {
          this.authService.logout();
        }
      }
    ];

    // Set initial title
    this.updateTitle(this.router.url);

    // Listen for navigation changes
    this.routerSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        this.updateTitle(event.urlAfterRedirects);
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  private updateTitle(url: string): void {
    // Match the base path (e.g. /organizations/123 → /organizations)
    const basePath = '/' + (url.split('/')[1] || '');
    this.currentTitle = this.routeTitleMap[basePath] || 'BADI';
  }
}
