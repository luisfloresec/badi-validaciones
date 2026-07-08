import { IsDateString, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class RescheduleDeliveryDto {
  @IsDateString()
  @IsNotEmpty()
  nuevaFecha: string;

  @IsString()
  @IsOptional()
  motivoReprogramacion?: string;

  @IsString()
  @IsNotEmpty()
  nuevaHora: string;
}
