import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Province } from './province.entity';

@Entity('ciudad')
export class City {
  @PrimaryGeneratedColumn('uuid', { name: 'id_ciudad' })
  id: string;

  @ManyToOne(() => Province, (province) => province.ciudades, { nullable: false, eager: true })
  @JoinColumn({ name: 'id_provincia' })
  provincia: Province;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 20, default: 'Activo' })
  estado: string;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamp' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion', type: 'timestamp', nullable: true })
  fechaActualizacion: Date;
}
