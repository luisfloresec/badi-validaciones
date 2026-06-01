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
import { AgreementType } from './agreement-type.entity';

@Entity('convenio')
export class Agreement {
  @PrimaryGeneratedColumn('uuid', { name: 'id_convenio' })
  id: string;

  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: 'id_organizacion' })
  organizacion: Organization;

  @ManyToOne(() => AgreementType, { nullable: false, eager: true })
  @JoinColumn({ name: 'id_tipo_convenio' })
  tipoConvenio: AgreementType;

  @Column({ name: 'codigo_convenio', type: 'varchar', length: 50, nullable: true })
  codigoConvenio: string;

  @Column({ name: 'fecha_inicio', type: 'date', nullable: true })
  fechaInicio: Date;

  @Column({ name: 'fecha_activacion', type: 'date', nullable: true })
  fechaActivacion: Date;

  @Column({ name: 'fecha_fin_estimada', type: 'date', nullable: true })
  fechaFinEstimada: Date;

  @Column({ name: 'retiros_realizados', type: 'int', default: 0 })
  retirosRealizados: number;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'varchar', length: 20, default: 'Registrado' })
  estado: string;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamp' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion', type: 'timestamp', nullable: true })
  fechaActualizacion: Date;
}
