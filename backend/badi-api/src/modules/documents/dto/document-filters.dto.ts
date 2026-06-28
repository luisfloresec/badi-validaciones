import { IsOptional, IsString, IsEnum, IsInt, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { EntityType } from '../enums/entity-type.enum';
import { DocumentStatus } from '../enums/document-status.enum';

export class DocumentFiltersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  tipoDocumentoId?: string;

  @IsOptional()
  @IsEnum(EntityType)
  entidadRelacionada?: EntityType;

  @IsOptional()
  @IsString()
  idEntidadRelacionada?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsString()
  organizacionId?: string;

  @IsOptional()
  @IsString()
  convenioId?: string;

  @IsOptional()
  @IsString()
  entregaId?: string;

  @IsOptional()
  @IsString()
  fechaDesde?: string;

  @IsOptional()
  @IsString()
  fechaHasta?: string;

  @IsOptional()
  @IsEnum(DocumentStatus)
  estado?: DocumentStatus;

  @IsOptional()
  @Type(() => Boolean)
  mostrarAnulados?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
