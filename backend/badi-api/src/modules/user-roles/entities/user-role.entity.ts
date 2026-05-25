import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';

@Entity('usuario_rol')
export class UserRole {
  @PrimaryGeneratedColumn('uuid', { name: 'id_usuario_rol' })
  id: string;

  @ManyToOne(() => User, (user) => user.usuarioRoles, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'id_usuario' })
  usuario: User;

  @ManyToOne(() => Role, (role) => role.usuarioRoles, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'id_rol' })
  rol: Role;

  @CreateDateColumn({ name: 'fecha_asignacion', type: 'timestamp' })
  fechaAsignacion: Date;
}
