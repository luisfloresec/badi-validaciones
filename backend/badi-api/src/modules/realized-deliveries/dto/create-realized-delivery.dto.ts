import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateRealizedDeliveryDto {
  @IsUUID()
  @IsNotEmpty()
  idEntregaProgramada: string;

  @IsDateString()
  @IsNotEmpty()
  fechaRealizacion: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @IsNotEmpty()
  kilosEntregados: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  personasAtendidas: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  beneficiariosAtendidos?: number;

  @IsString()
  @IsNotEmpty()
  detalleProductos: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
