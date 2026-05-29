import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, Matches } from 'class-validator';

export class CreateAttendedGroupWithLeaderDto {
  // --- Grupo Atendido ---
  @IsNotEmpty({ message: 'El nombre del grupo atendido es obligatorio.' })
  @IsString()
  @MaxLength(150, { message: 'El nombre no puede exceder 150 caracteres.' })
  nombre: string;

  @IsNotEmpty({ message: 'El grupo etario es obligatorio.' })
  @IsUUID('all', { message: 'ID de grupo etario inválido.' })
  grupoEtarioId: string;

  @IsNotEmpty({ message: 'El nivel de vulnerabilidad es obligatorio.' })
  @IsUUID('all', { message: 'ID de vulnerabilidad inválido.' })
  vulnerabilidadId: string;

  @IsNotEmpty({ message: 'El número de personas es obligatorio.' })
  @IsNumber({}, { message: 'El número de personas debe ser numérico.' })
  @Min(1, { message: 'Debe haber al menos 1 persona en el grupo.' })
  numeroPersonas: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  // --- Dirigente Inicial ---
  @IsBoolean({ message: 'Debe especificar si usa el representante activo.' })
  useActiveRepresentative: boolean;

  // Campos de dirigente nuevo (opcionales si useActiveRepresentative = true)
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
