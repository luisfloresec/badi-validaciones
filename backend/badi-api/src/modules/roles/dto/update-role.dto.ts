import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from './create-role.dto';

/**
 * Todos los campos de CreateRoleDto se vuelven opcionales.
 * El campo 'estado' no se incluye porque no forma parte de CreateRoleDto;
 * para desactivar un rol se usa el endpoint dedicado PATCH /roles/:id/deactivate.
 */
export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
