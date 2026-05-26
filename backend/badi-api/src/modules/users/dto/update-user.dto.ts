import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

/**
 * Todos los campos de CreateUserDto se vuelven opcionales.
 * El campo 'estado' no se incluye porque no forma parte de CreateUserDto;
 * para desactivar un usuario se usa el endpoint dedicado PATCH /users/:id/deactivate.
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
