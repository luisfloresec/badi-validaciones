import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateRepresentativeDto } from './create-representative.dto';

/**
 * Todos los campos de CreateRepresentativeDto se vuelven opcionales,
 * excepto organizationId que se omite porque el representante
 * no puede moverse a otra organización después de crearse.
 * El campo 'estado' no se incluye; para desactivar se usa
 * PATCH /representatives/:id/deactivate.
 */
export class UpdateRepresentativeDto extends PartialType(
  OmitType(CreateRepresentativeDto, ['organizationId'] as const),
) {}
