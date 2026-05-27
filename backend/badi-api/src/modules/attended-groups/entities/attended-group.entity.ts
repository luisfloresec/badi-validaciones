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
import { Catalog } from '../../catalogs/entities/catalog.entity';

@Entity('grupo_atendido')
export class AttendedGroup {
  @PrimaryGeneratedColumn('uuid', { name: 'id_grupo_atendido' })
  id: string;

  @ManyToOne(() => Organization, { nullable: false, eager: true })
  @JoinColumn({ name: 'id_organizacion' })
  organizacion: Organization;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @ManyToOne(() => Catalog, { nullable: false, eager: true })
  @JoinColumn({ name: 'id_grupo_etario' })
  grupoEtario: Catalog;

  @ManyToOne(() => Catalog, { nullable: false, eager: true })
  @JoinColumn({ name: 'id_vulnerabilidad' })
  vulnerabilidad: Catalog;

  @Column({ name: 'numero_personas', type: 'int' })
  numeroPersonas: number;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'varchar', length: 20, default: 'Activo' })
  estado: string;

  @CreateDateColumn({ name: 'fecha_registro', type: 'timestamp' })
  fechaRegistro: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion', type: 'timestamp', nullable: true })
  fechaActualizacion: Date;
}
