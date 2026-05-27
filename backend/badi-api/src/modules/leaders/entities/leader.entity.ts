import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AttendedGroup } from '../../attended-groups/entities/attended-group.entity';
import { Representative } from '../../representatives/entities/representative.entity';

@Entity('dirigente')
export class Leader {
  @PrimaryGeneratedColumn('uuid', { name: 'id_dirigente' })
  id: string;

  @ManyToOne(() => AttendedGroup, { nullable: false, eager: true })
  @JoinColumn({ name: 'id_grupo_atendido' })
  grupoAtendido: AttendedGroup;

  @ManyToOne(() => Representative, { nullable: true, eager: true })
  @JoinColumn({ name: 'id_representante' })
  representante: Representative;

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

  @Column({ type: 'varchar', length: 20, default: 'Activo' })
  estado: string;

  @CreateDateColumn({ name: 'fecha_registro', type: 'timestamp' })
  fechaRegistro: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion', type: 'timestamp', nullable: true })
  fechaActualizacion: Date;
}
