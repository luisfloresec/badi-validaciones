import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_ip', type: 'varchar', length: 45, nullable: true })
  userIp: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true })
  userAgent: string;

  @Column({ type: 'varchar', length: 100 })
  modulo: string;

  @Column({ type: 'varchar', length: 100 })
  entidad: string;

  @Column({ name: 'entidad_id', type: 'varchar', length: 255, nullable: true })
  entidadId?: string | null;

  @Column({ type: 'varchar', length: 50 })
  accion: string; // CREATE, UPDATE, DELETE, LOGIN, etc.

  @Column({ name: 'datos_anteriores', type: 'jsonb', nullable: true })
  datosAnteriores: any;

  @Column({ name: 'datos_nuevos', type: 'jsonb', nullable: true })
  datosNuevos: any;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resultado: string; // EXITO, ERROR, etc.

  @CreateDateColumn({ name: 'fecha_hora', type: 'timestamp' })
  fechaHora: Date;
}
