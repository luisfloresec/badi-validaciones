import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [MatToolbarModule, MatIconModule, MatButtonModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss'
})
export class TopbarComponent implements OnInit, OnDestroy {

  currentTitle = 'Panel de Control';

  private readonly routeTitleMap: Record<string, string> = {
    '/dashboard': 'Panel de Control',
    '/organizations': 'Organizaciones',
    '/agreements': 'Convenios',
    '/users': 'Usuarios',
    '/roles': 'Roles',
    '/documents': 'Repositorio Global',
    '/schedule': 'Cronograma',
    '/audit': 'Auditoría'
  };

  private routerSub?: Subscription;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Set initial title
    this.updateTitle(this.router.url);

    // Listen for navigation changes
    this.routerSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => this.updateTitle(event.urlAfterRedirects));
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
