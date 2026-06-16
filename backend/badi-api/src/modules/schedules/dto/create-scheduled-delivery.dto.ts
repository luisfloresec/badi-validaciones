import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateScheduledDeliveryDto {
  @IsUUID()
  @IsNotEmpty()
  agreementId: string;

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
}
