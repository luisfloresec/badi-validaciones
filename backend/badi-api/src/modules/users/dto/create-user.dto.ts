import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsArray,
  IsUUID,
} from 'class-validator';
import { IsCedulaEcuatoriana } from '../../../common/validators/cedula-ecuatoriana.validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'El campo nombres es obligatorio.' })
  @MaxLength(100, { message: 'El campo nombres no debe exceder 100 caracteres.' })
  nombres: string;

  @IsString()
  @IsNotEmpty({ message: 'El campo apellidos es obligatorio.' })
  @MaxLength(100, {
    message: 'El campo apellidos no debe exceder 100 caracteres.',
  })
  apellidos: string;

  @IsOptional()
  @IsString()
  @IsCedulaEcuatoriana()
  cedula?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, {
    message: 'El campo teléfono no debe exceder 20 caracteres.',
  })
  telefono?: string;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  roleIds?: string[];

  @IsEmail({}, { message: 'El campo email debe tener un formato válido.' })
  @IsNotEmpty({ message: 'El campo email es obligatorio.' })
  @MaxLength(120, { message: 'El campo email no debe exceder 120 caracteres.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'El campo password es obligatorio.' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  password: string;
}
