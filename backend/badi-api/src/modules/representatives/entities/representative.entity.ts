import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('representante')
export class Representative {
  @PrimaryGeneratedColumn('uuid', { name: 'id_representante' })
  id: string;

  @ManyToOne(() => Organization, { nullable: false, eager: true })
  @JoinColumn({ name: 'id_organizacion' })
  organizacion: Organization;

  @Column({ type: 'varchar', length: 100 })
  nombres: string;

  @Column({ type: 'varchar', length: 100 })
  apellidos: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  cedula: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cargo: string;

  @Column({ name: 'es_principal', type: 'boolean' })
  esPrincipal: boolean;

  @Column({ type: 'varchar', length: 20, default: 'Activo' })
  estado: string;

  @CreateDateColumn({ name: 'fecha_registro', type: 'timestamp' })
  fechaRegistro: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion', type: 'timestamp', nullable: true })
  fechaActualizacion: Date;
}
