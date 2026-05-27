import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { IsCedulaEcuatoriana } from '../../../common/validators/cedula-ecuatoriana.validator';

export class CreateRepresentativeDto {
  @IsUUID('all', { message: 'El campo organizationId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El campo organizationId es obligatorio.' })
  organizationId: string;

  @IsString({ message: 'El campo nombres debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El campo nombres es obligatorio.' })
  @MaxLength(100, { message: 'El campo nombres no debe exceder 100 caracteres.' })
  nombres: string;

  @IsString({ message: 'El campo apellidos debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El campo apellidos es obligatorio.' })
  @MaxLength(100, { message: 'El campo apellidos no debe exceder 100 caracteres.' })
  apellidos: string;

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

  @IsOptional()
  @IsString({ message: 'El campo cargo debe ser una cadena de texto.' })
  @MaxLength(100, { message: 'El campo cargo no debe exceder 100 caracteres.' })
  cargo?: string;

  @IsBoolean({ message: 'El campo esPrincipal debe ser un valor booleano.' })
  esPrincipal: boolean;
}
