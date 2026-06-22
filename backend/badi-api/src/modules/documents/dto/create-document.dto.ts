import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
  IsIn,
  MaxLength,
} from 'class-validator';
import { EntityType } from '../enums/entity-type.enum';
import { UploadOrigin } from '../enums/upload-origin.enum';

export class CreateDocumentDto {
  @IsUUID()
  @IsNotEmpty({ message: 'El tipo documental es obligatorio.' })
  tipoDocumentoId: string;

  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio.' })
  @MaxLength(300, { message: 'El título no puede superar 300 caracteres.' })
  titulo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsDateString({}, { message: 'fechaDocumento debe tener formato YYYY-MM-DD.' })
  fechaDocumento?: string;

  @IsOptional()
  @IsIn(Object.values(EntityType), {
    message: 'entidadRelacionada debe ser ORGANIZACION, CONVENIO, ENTREGA_REALIZADA o GENERAL.',
  })
  entidadRelacionada?: EntityType;

  @IsOptional()
  @IsUUID()
  idEntidadRelacionada?: string;

  @IsString()
  @IsIn(Object.values(UploadOrigin), {
    message: 'origenCarga debe ser GESTION_DOCUMENTAL, ORGANIZACION, CONVENIO o ENTREGA_REALIZADA.',
  })
  origenCarga: UploadOrigin;
}
