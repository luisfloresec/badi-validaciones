import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCatalogDto {
  @IsString({ message: 'El campo tipoCatalogo debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El campo tipoCatalogo es obligatorio.' })
  @MaxLength(60, {
    message: 'El campo tipoCatalogo no debe exceder 60 caracteres.',
  })
  tipoCatalogo: string;

  @IsString({ message: 'El campo nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El campo nombre es obligatorio.' })
  @MaxLength(120, {
    message: 'El campo nombre no debe exceder 120 caracteres.',
  })
  nombre: string;

  @IsOptional()
  @IsString({ message: 'El campo descripcion debe ser una cadena de texto.' })
  descripcion?: string;
}
