import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignRoleDto {
  @IsUUID('all', { message: 'El campo userId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El campo userId es obligatorio.' })
  userId: string;

  @IsUUID('all', { message: 'El campo roleId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El campo roleId es obligatorio.' })
  roleId: string;
}
