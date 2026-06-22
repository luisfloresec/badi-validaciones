import { IsNotEmpty, IsOptional, IsString, MaxLength, IsIn } from 'class-validator';

export class CreateRoleDto {
  @IsString({ message: 'El campo nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El campo nombre es obligatorio.' })
  @MaxLength(80, { message: 'El campo nombre no debe exceder 80 caracteres.' })
  nombre: string;

  @IsOptional()
  @IsString({ message: 'El campo descripcion debe ser una cadena de texto.' })
  descripcion?: string;

  @IsNotEmpty({ message: 'El campo perfilAcceso es obligatorio.' })
  @IsIn(['Administrador', 'Gestión Social', 'Auditor'], {
    message: 'El perfil de acceso debe ser Administrador, Gestión Social o Auditor.',
  })
  perfilAcceso: string;
}
