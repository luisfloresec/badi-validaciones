import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { IsCedulaEcuatoriana } from '../../../common/validators/cedula-ecuatoriana.validator';

export class ReplaceRepresentativeDto {
  @IsString({ message: 'El campo nombres debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El campo nombres es obligatorio.' })
  @MaxLength(100, { message: 'El campo nombres no debe exceder 100 caracteres.' })
  nombres: string;

  @IsString({ message: 'El campo apellidos debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El campo apellidos es obligatorio.' })
  @MaxLength(100, { message: 'El campo apellidos no debe exceder 100 caracteres.' })
  apellidos: string;

  @IsString({ message: 'El campo cedula debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El campo cedula es obligatorio.' })
  @IsCedulaEcuatoriana()
  cedula: string;

  @IsOptional()
  @IsString({ message: 'El campo telefono debe ser una cadena de texto.' })
  @MaxLength(20, { message: 'El campo telefono no debe exceder 20 caracteres.' })
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El campo email debe tener un formato válido.' })
  @MaxLength(120, { message: 'El campo email no debe exceder 120 caracteres.' })
  email?: string;
}
