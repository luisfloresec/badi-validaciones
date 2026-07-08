import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * Expresión regular de contraseña segura para BADI.
 * Mínimo 8 caracteres, al menos: 1 mayúscula, 1 minúscula, 1 número,
 * 1 carácter especial, sin espacios en blanco.
 */
export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const STRONG_PASSWORD_MESSAGE =
  'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial permitido: @ $ ! % * ? &.';

/**
 * Decorator de class-validator reutilizable.
 * Uso: @IsStrongPassword() encima del campo en cualquier DTO.
 */
export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: (object as any).constructor,
      propertyName,
      options: {
        message: STRONG_PASSWORD_MESSAGE,
        ...validationOptions,
      },
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          return STRONG_PASSWORD_REGEX.test(value);
        },
      },
    });
  };
}
