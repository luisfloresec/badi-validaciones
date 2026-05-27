import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateLeaderDto } from './create-leader.dto';

/**
 * Todos los campos de CreateLeaderDto se vuelven opcionales,
 * excepto groupId y representativeId que se omiten porque el dirigente
 * no puede moverse de grupo ni de representante desde la actualización.
 * El campo 'estado' no se incluye; para desactivar se usa
 * PATCH /leaders/:id/deactivate.
 */
export class UpdateLeaderDto extends PartialType(
  OmitType(CreateLeaderDto, ['groupId', 'representativeId'] as const),
) {}
