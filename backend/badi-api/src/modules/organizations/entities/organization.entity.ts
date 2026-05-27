import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizationType } from '../../organization-types/entities/organization-type.entity';
import { Catalog } from '../../catalogs/entities/catalog.entity';

@Entity('organizacion')
export class Organization {
  @PrimaryGeneratedColumn('uuid', { name: 'id_organizacion' })
  id: string;

  @ManyToOne(() => OrganizationType, { nullable: false, eager: true })
  @JoinColumn({ name: 'id_tipo_organizacion' })
  tipoOrganizacion: OrganizationType;

  @Column({ type: 'varchar', length: 13, unique: true })
  ruc: string;

  @Column({ name: 'razon_social', type: 'varchar', length: 180 })
  razonSocial: string;

  @Column({ name: 'nombre_comercial', type: 'varchar', length: 180, nullable: true })
  nombreComercial: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 80 })
  ciudad: string;

  @Column({ name: 'sector_barrio', type: 'varchar', length: 120, nullable: true })
  sectorBarrio: string;

  @Column({ type: 'text' })
  direccion: string;

  @Column({ name: 'referencia_direccion', type: 'text', nullable: true })
  referenciaDireccion: string;

  @ManyToOne(() => Catalog, { nullable: false, eager: true })
  @JoinColumn({ name: 'id_accion_social' })
  accionSocial: Catalog;

  @ManyToOne(() => Catalog, { nullable: false, eager: true })
  @JoinColumn({ name: 'id_segmento' })
  segmento: Catalog;

  @ManyToOne(() => Catalog, { nullable: true, eager: true })
  @JoinColumn({ name: 'id_frecuencia_retiro' })
  frecuenciaRetiro: Catalog;

  @Column({
    name: 'cuota_recuperacion_estimada',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  cuotaRecuperacionEstimada: number;

  @Column({ name: 'total_personas_atendidas', type: 'int' })
  totalPersonasAtendidas: number;

  @ManyToOne(() => Catalog, { nullable: true, eager: true })
  @JoinColumn({ name: 'id_transporte' })
  transporte: Catalog;

  @Column({ name: 'redes_sociales', type: 'jsonb', nullable: true })
  redesSociales: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'varchar', length: 30, default: 'Registrada' })
  estado: string;

  @CreateDateColumn({ name: 'fecha_registro', type: 'timestamp' })
  fechaRegistro: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion', type: 'timestamp', nullable: true })
  fechaActualizacion: Date;
}
