import { IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPassword } from '../../../common/validators/password-strong.validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'El token es obligatorio.' })
  token: string;

  @IsString()
  @IsNotEmpty({ message: 'La nueva contraseña es obligatoria.' })
  @IsStrongPassword()
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'La confirmación de la contraseña es obligatoria.' })
  confirmPassword: string;
}
