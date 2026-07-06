import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Expresión regular de contraseña segura para BADI.
 * Mínimo 8 caracteres, al menos: 1 mayúscula, 1 minúscula, 1 número,
 * 1 carácter especial, sin espacios en blanco.
 */
export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])[^\s]{8,}$/;

export const STRONG_PASSWORD_MESSAGE =
  'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial, sin espacios.';

/**
 * Angular Validator reutilizable.
 * Uso: Validators.compose([..., passwordStrongValidator])
 * O en FormControl: new FormControl('', [passwordStrongValidator])
 */
export const passwordStrongValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value: string = control.value || '';
  if (!value) return null; // No interferir con Validators.required
  return STRONG_PASSWORD_REGEX.test(value)
    ? null
    : { weakPassword: STRONG_PASSWORD_MESSAGE };
};
