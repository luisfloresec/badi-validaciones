import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isCedulaEcuatoriana', async: false })
export class IsCedulaEcuatorianaConstraint
  implements ValidatorConstraintInterface
{
  validate(cedula: string): boolean {
    // Si el valor es vacío o nulo, @IsOptional se encarga
    if (!cedula) return true;

    // Debe tener exactamente 10 dígitos
    if (!/^\d{10}$/.test(cedula)) return false;

    const digits = cedula.split('').map(Number);

    // Los dos primeros dígitos corresponden a provincia (01 a 24)
    const provincia = parseInt(cedula.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) return false;

    // El tercer dígito debe ser menor a 6 (persona natural)
    if (digits[2] >= 6) return false;

    // Algoritmo módulo 10
    let suma = 0;
    for (let i = 0; i < 9; i++) {
      let valor = digits[i];
      if (i % 2 === 0) {
        // Posiciones pares (0, 2, 4, 6, 8): multiplicar por 2
        valor *= 2;
        if (valor > 9) valor -= 9;
      }
      // Posiciones impares (1, 3, 5, 7): multiplicar por 1 (sin cambio)
      suma += valor;
    }

    const digitoVerificador = suma % 10 === 0 ? 0 : 10 - (suma % 10);
    return digitoVerificador === digits[9];
  }

  defaultMessage(): string {
    return 'La cédula ecuatoriana no es válida. Debe tener 10 dígitos y cumplir el algoritmo de validación.';
  }
}

export function IsCedulaEcuatoriana(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCedulaEcuatorianaConstraint,
    });
  };
}
