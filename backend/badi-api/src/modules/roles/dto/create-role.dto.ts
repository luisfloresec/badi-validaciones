import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @IsString({ message: 'El campo nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El campo nombre es obligatorio.' })
  @MaxLength(80, { message: 'El campo nombre no debe exceder 80 caracteres.' })
  nombre: string;

  @IsOptional()
  @IsString({ message: 'El campo descripcion debe ser una cadena de texto.' })
  descripcion?: string;
}
