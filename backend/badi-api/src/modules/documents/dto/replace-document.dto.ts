import { IsString, IsNotEmpty, MinLength } from 'class-validator';

/**
 * Para reemplazar un documento se requiere solo el motivo.
 * El archivo nuevo viene como multipart/form-data junto a este campo.
 */
export class ReplaceDocumentDto {
  @IsString()
  @IsNotEmpty({ message: 'El motivo de reemplazo es obligatorio.' })
  @MinLength(5, { message: 'El motivo debe tener al menos 5 caracteres.' })
  motivoReemplazo: string;
}
