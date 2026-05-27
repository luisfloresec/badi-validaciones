import { PartialType } from '@nestjs/mapped-types';
import { CreateOrganizationDto } from './create-organization.dto';

/**
 * Todos los campos de CreateOrganizationDto se vuelven opcionales.
 * El campo 'estado' no se incluye porque no forma parte de CreateOrganizationDto;
 * para desactivar una organización se usa el endpoint dedicado
 * PATCH /organizations/:id/deactivate.
 */
export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {}
