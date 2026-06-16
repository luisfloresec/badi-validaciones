import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateScheduledDeliveryDto {
  @IsString()
  @IsOptional()
  @MaxLength(300)
  descripcion?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;
}
