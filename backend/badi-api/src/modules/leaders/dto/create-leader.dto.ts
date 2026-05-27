import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { IsCedulaEcuatoriana } from '../../../common/validators/cedula-ecuatoriana.validator';

export class CreateLeaderDto {
  @IsUUID('all', { message: 'El campo groupId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El campo groupId es obligatorio.' })
  groupId: string;

  @IsOptional()
  @IsUUID('all', { message: 'El campo representativeId debe ser un UUID válido.' })
  representativeId?: string;

  @ValidateIf((o) => !o.representativeId)
  @IsString({ message: 'El campo nombres debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El campo nombres es obligatorio si no hay representante.' })
  @MaxLength(100, { message: 'El campo nombres no debe exceder 100 caracteres.' })
  nombres?: string;

  @ValidateIf((o) => !o.representativeId)
  @IsString({ message: 'El campo apellidos debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El campo apellidos es obligatorio si no hay representante.' })
  @MaxLength(100, { message: 'El campo apellidos no debe exceder 100 caracteres.' })
  apellidos?: string;

  @IsOptional()
  @IsString()
  @IsCedulaEcuatoriana()
  cedula?: string;

  @IsOptional()
  @IsString({ message: 'El campo telefono debe ser una cadena de texto.' })
  @MaxLength(20, { message: 'El campo telefono no debe exceder 20 caracteres.' })
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El campo email debe tener un formato válido.' })
  @MaxLength(120, { message: 'El campo email no debe exceder 120 caracteres.' })
  email?: string;
}
