import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateAttendedGroupDto } from './create-attended-group.dto';

/**
 * Todos los campos de CreateAttendedGroupDto se vuelven opcionales,
 * excepto organizationId que se omite porque el grupo atendido
 * no puede moverse a otra organización después de crearse.
 * El campo 'estado' no se incluye; para desactivar se usa
 * PATCH /attended-groups/:id/deactivate.
 */
export class UpdateAttendedGroupDto extends PartialType(
  OmitType(CreateAttendedGroupDto, ['organizationId'] as const),
) {}
