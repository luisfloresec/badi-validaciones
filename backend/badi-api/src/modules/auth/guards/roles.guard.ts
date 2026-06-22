import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Guard global que verifica que el usuario autenticado
 * tenga al menos uno de los roles requeridos por el endpoint.
 * Si no se especifican roles (@Roles), el endpoint es accesible para cualquier usuario autenticado.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Si es público, dejar pasar (el JwtAuthGuard ya maneja esto, pero por seguridad)
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // Si no se definieron roles requeridos, permitir a cualquier usuario autenticado
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    if (!user || !user.roles) return false;

    return requiredRoles.some((requiredRole) =>
      user.roles.some(
        (r) => r.nombre === requiredRole || r.perfilAcceso === requiredRole
      )
    );
  }
}
