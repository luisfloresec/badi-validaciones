import { PartialType } from '@nestjs/mapped-types';
import { CreateCatalogDto } from './create-catalog.dto';

/**
 * Todos los campos de CreateCatalogDto se vuelven opcionales.
 * El campo 'estado' no se incluye porque no forma parte de CreateCatalogDto;
 * para desactivar un catálogo se usa el endpoint dedicado PATCH /catalogs/:id/deactivate.
 */
export class UpdateCatalogDto extends PartialType(CreateCatalogDto) {}
