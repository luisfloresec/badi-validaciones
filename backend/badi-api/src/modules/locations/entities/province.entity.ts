import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { City } from './city.entity';

@Entity('provincia')
export class Province {
  @PrimaryGeneratedColumn('uuid', { name: 'id_provincia' })
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  nombre: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  codigo: string;

  @Column({ type: 'varchar', length: 20, default: 'Activo' })
  estado: string;

  @OneToMany(() => City, (city) => city.provincia)
  ciudades: City[];

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamp' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion', type: 'timestamp', nullable: true })
  fechaActualizacion: Date;
}
