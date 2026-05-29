import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class ReplaceLeaderDto {
  @IsBoolean({ message: 'Debe especificar si usa el representante activo.' })
  useActiveRepresentative: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombres?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  apellidos?: string;

  @IsOptional()
  @Matches(/^[0-9]{10}$/, { message: 'La cédula debe tener exactamente 10 dígitos.' })
  cedula?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Formato de correo electrónico inválido.' })
  @MaxLength(120)
  email?: string;
}
