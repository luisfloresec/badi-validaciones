import { IsOptional, IsString, IsNumber, MaxLength } from 'class-validator';

export class UpdateScheduledDeliveryDto {
  @IsString()
  @IsOptional()
  @MaxLength(300)
  descripcion?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsString()
  @IsOptional()
  estadoSeguimiento?: string;

  @IsNumber()
  @IsOptional()
  cuota?: number;
}
