import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  IsInt,
  IsIn,
  MaxLength,
  MinLength,
  Min,
  Max,
  ArrayNotEmpty,
} from 'class-validator';

export class CreateDocumentTypeDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MaxLength(120, { message: 'El nombre no puede superar 120 caracteres.' })
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'El código es obligatorio.' })
  @MaxLength(60, { message: 'El código no puede superar 60 caracteres.' })
  @MinLength(2, { message: 'El código debe tener al menos 2 caracteres.' })
  codigo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  @IsIn(['MODULO', 'GESTION_DOCUMENTAL', 'AMBOS'], {
    message: 'origenPermitido debe ser MODULO, GESTION_DOCUMENTAL o AMBOS.',
  })
  origenPermitido?: string;

  @IsArray({ message: 'entidadesPermitidas debe ser un array.' })
  @ArrayNotEmpty({ message: 'entidadesPermitidas no puede estar vacío.' })
  @IsString({ each: true })
  @IsIn(['ORGANIZACION', 'CONVENIO', 'ENTREGA_REALIZADA', 'GENERAL'], {
    each: true,
    message: 'Cada entidad debe ser ORGANIZACION, CONVENIO, ENTREGA_REALIZADA o GENERAL.',
  })
  entidadesPermitidas: string[];

  @IsOptional()
  @IsBoolean()
  requiereEntidadRelacionada?: boolean;

  @IsOptional()
  @IsBoolean()
  permiteCargaGeneral?: boolean;

  @IsOptional()
  @IsBoolean()
  permiteReemplazo?: boolean;

  @IsOptional()
  @IsBoolean()
  esEvidencia?: boolean;

  @IsArray({ message: 'extensionesPermitidas debe ser un array.' })
  @ArrayNotEmpty({ message: 'extensionesPermitidas no puede estar vacío.' })
  @IsString({ each: true })
  extensionesPermitidas: string[];

  @IsOptional()
  @IsInt({ message: 'tamanoMaximoMb debe ser un número entero.' })
  @Min(1, { message: 'El tamaño mínimo es 1 MB.' })
  @Max(100, { message: 'El tamaño máximo es 100 MB.' })
  tamanoMaximoMb?: number;

  @IsOptional()
  @IsBoolean()
  requiereFechaDocumento?: boolean;

  @IsOptional()
  @IsBoolean()
  observacionesObligatorias?: boolean;
}
