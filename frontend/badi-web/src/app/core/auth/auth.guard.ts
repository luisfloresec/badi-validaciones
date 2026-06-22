import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Guard funcional que verifica autenticación.
 * Redirige a /login si no hay token válido.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const user = authService.getCurrentUser();
    if (user?.requiereCambioPassword && !state.url.includes('/profile')) {
      return router.parseUrl('/profile');
    }
    return true;
  }

  router.navigate(['/login']);
  return false;
};
