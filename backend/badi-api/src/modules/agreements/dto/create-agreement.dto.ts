import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAgreementDto {
  @IsUUID('all', { message: 'El ID de la organización debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El ID de la organización es obligatorio.' })
  organizationId: string;

  @IsUUID('all', { message: 'El ID del tipo de convenio debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El ID del tipo de convenio es obligatorio.' })
  tipoConvenioId: string;

  @IsString({ message: 'El código del convenio debe ser texto.' })
  @MaxLength(50, { message: 'El código del convenio no puede superar los 50 caracteres.' })
  @IsNotEmpty({ message: 'El código del convenio es obligatorio.' })
  codigoConvenio: string;

  @IsString({ message: 'La fecha de inicio debe ser texto válido.' })
  @IsOptional()
  fechaInicio?: string;

  @IsString({ message: 'Las observaciones deben ser texto.' })
  @IsOptional()
  observaciones?: string;
}
