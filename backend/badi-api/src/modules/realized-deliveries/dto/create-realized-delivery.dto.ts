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
  @Min(0)
  @IsNotEmpty()
  cuota: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  kilosEntregados?: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  personasAtendidas: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  beneficiariosAtendidos?: number;

  @IsOptional()
  @IsString()
  detalleProductos?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
