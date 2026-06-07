import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateAgreementTypeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  duracionMeses?: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  maxRetiros?: number;
}
