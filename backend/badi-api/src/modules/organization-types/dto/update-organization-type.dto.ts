import { PartialType } from '@nestjs/mapped-types';
import { CreateOrganizationTypeDto } from './create-organization-type.dto';

/**
 * Todos los campos de CreateOrganizationTypeDto se vuelven opcionales.
 * El campo 'estado' no se incluye porque no forma parte de CreateOrganizationTypeDto;
 * para desactivar se usa el endpoint dedicado PATCH /organization-types/:id/deactivate.
 */
export class UpdateOrganizationTypeDto extends PartialType(CreateOrganizationTypeDto) {}
