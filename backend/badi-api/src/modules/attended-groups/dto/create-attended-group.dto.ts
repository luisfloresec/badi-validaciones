import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAttendedGroupDto {
  @IsUUID('all', { message: 'El campo organizationId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El campo organizationId es obligatorio.' })
  organizationId: string;

  @IsString({ message: 'El campo nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El campo nombre es obligatorio.' })
  @MaxLength(150, { message: 'El campo nombre no debe exceder 150 caracteres.' })
  nombre: string;

  @IsUUID('all', { message: 'El campo grupoEtarioId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El campo grupoEtarioId es obligatorio.' })
  grupoEtarioId: string;

  @IsArray({ message: 'El campo vulnerabilidadIds debe ser un arreglo.' })
  @ArrayNotEmpty({ message: 'Debe seleccionar al menos una vulnerabilidad.' })
  @IsUUID('all', { each: true, message: 'Cada vulnerabilidad debe ser un UUID válido.' })
  vulnerabilidadIds: string[];

  @IsInt({ message: 'El campo numeroPersonas debe ser un número entero.' })
  @Min(0, { message: 'El número de personas no puede ser negativo.' })
  numeroPersonas: number;

  @IsOptional()
  @IsString({ message: 'El campo observaciones debe ser una cadena de texto.' })
  observaciones?: string;
}
