import { IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';

/**
 * Solo permite actualizar campos de metadata, no el archivo ni el tipo documental.
 */
export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'El título no puede superar 300 caracteres.' })
  titulo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsDateString({}, { message: 'fechaDocumento debe tener formato YYYY-MM-DD.' })
  fechaDocumento?: string;
}
