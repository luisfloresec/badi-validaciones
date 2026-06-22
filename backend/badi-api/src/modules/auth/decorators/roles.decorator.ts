import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator que indica qué roles tienen acceso al endpoint.
 * Uso: @Roles('Administrador', 'Gestión Social')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
