import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class RescheduleDeliveryDto {
  @IsDateString()
  @IsNotEmpty()
  nuevaFecha: string;

  @IsString()
  @IsNotEmpty()
  motivoReprogramacion: string;
}
