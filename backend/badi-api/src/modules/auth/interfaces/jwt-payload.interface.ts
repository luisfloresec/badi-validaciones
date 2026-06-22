/**
 * Payload que se almacena dentro del JWT.
 */
export interface JwtPayload {
  /** UUID del usuario */
  sub: string;
  email: string;
  nombres: string;
  apellidos: string;
  /** Roles asignados al usuario con su perfil de acceso */
  roles: { nombre: string; perfilAcceso: string }[];
}
