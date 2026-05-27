import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateOrganizationDto {
  @IsUUID('all', { message: 'El campo tipoOrganizacionId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El campo tipoOrganizacionId es obligatorio.' })
  tipoOrganizacionId: string;

  @IsString({ message: 'El campo ruc debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El campo ruc es obligatorio.' })
  @Matches(/^[0-9]{13}$/, {
    message: 'El RUC debe contener exactamente 13 dígitos numéricos.',
  })
  ruc: string;

  @IsString({ message: 'El campo razonSocial debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El campo razonSocial es obligatorio.' })
  @MaxLength(180, { message: 'El campo razonSocial no debe exceder 180 caracteres.' })
  razonSocial: string;

  @IsOptional()
  @IsString({ message: 'El campo nombreComercial debe ser una cadena de texto.' })
  @MaxLength(180, { message: 'El campo nombreComercial no debe exceder 180 caracteres.' })
  nombreComercial?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El campo email debe tener un formato válido.' })
  @MaxLength(120, { message: 'El campo email no debe exceder 120 caracteres.' })
  email?: string;

  @IsString({ message: 'El campo ciudad debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El campo ciudad es obligatorio.' })
  @MaxLength(80, { message: 'El campo ciudad no debe exceder 80 caracteres.' })
  ciudad: string;

  @IsOptional()
  @IsString({ message: 'El campo sectorBarrio debe ser una cadena de texto.' })
  @MaxLength(120, { message: 'El campo sectorBarrio no debe exceder 120 caracteres.' })
  sectorBarrio?: string;

  @IsString({ message: 'El campo direccion debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El campo direccion es obligatorio.' })
  direccion: string;

  @IsOptional()
  @IsString({ message: 'El campo referenciaDireccion debe ser una cadena de texto.' })
  referenciaDireccion?: string;

  @IsUUID('all', { message: 'El campo accionSocialId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El campo accionSocialId es obligatorio.' })
  accionSocialId: string;

  @IsUUID('all', { message: 'El campo segmentoId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El campo segmentoId es obligatorio.' })
  segmentoId: string;

  @IsOptional()
  @IsUUID('all', { message: 'El campo frecuenciaRetiroId debe ser un UUID válido.' })
  frecuenciaRetiroId?: string;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El campo cuotaRecuperacionEstimada debe ser un número con máximo 2 decimales.' },
  )
  @Min(0, { message: 'La cuota de recuperación estimada no puede ser negativa.' })
  cuotaRecuperacionEstimada?: number;

  @IsInt({ message: 'El campo totalPersonasAtendidas debe ser un número entero.' })
  @Min(0, { message: 'El total de personas atendidas no puede ser negativo.' })
  totalPersonasAtendidas: number;

  @IsOptional()
  @IsUUID('all', { message: 'El campo transporteId debe ser un UUID válido.' })
  transporteId?: string;

  @IsOptional()
  @IsObject({ message: 'El campo redesSociales debe ser un objeto JSON.' })
  redesSociales?: Record<string, any>;

  @IsOptional()
  @IsString({ message: 'El campo observaciones debe ser una cadena de texto.' })
  observaciones?: string;
}
