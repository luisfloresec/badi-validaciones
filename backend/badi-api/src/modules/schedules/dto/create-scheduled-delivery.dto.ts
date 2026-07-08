import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateScheduledDeliveryDto {
  @IsUUID()
  @IsNotEmpty()
  organizationId: string;

  @IsUUID()
  @IsOptional()
  agreementId?: string;

  @IsDateString()
  @IsNotEmpty()
  fechaProgramada: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  descripcion?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsString()
  @IsNotEmpty()
  horaProgramada: string;

  @IsString()
  @IsOptional()
  estadoSeguimiento?: string;

}
