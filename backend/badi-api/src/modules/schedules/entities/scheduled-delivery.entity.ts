import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Agreement } from '../../agreements/entities/agreement.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('entrega_programada')
export class ScheduledDelivery {
  @PrimaryGeneratedColumn('uuid', { name: 'id_entrega' })
  id: string;

  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: 'id_organizacion' })
  organizacion: Organization;

  @ManyToOne(() => Agreement, { nullable: true })
  @JoinColumn({ name: 'id_convenio' })
  convenio: Agreement;

  @Column({ name: 'fecha_programada', type: 'date' })
  fechaProgramada: Date;

  @Column({ name: 'fecha_original', type: 'date', nullable: true })
  fechaOriginal: Date;

  @Column({ name: 'hora_programada', type: 'varchar', length: 10, default: '09:00' })
  horaProgramada: string;

  @Column({ name: 'cuota', type: 'numeric', precision: 10, scale: 2, nullable: true })
  cuota: number;

  @Column({ name: 'kilos_estimados', type: 'numeric', precision: 10, scale: 2, nullable: true })
  kilosEstimados: number;

  @Column({ type: 'varchar', length: 300, nullable: true })
  descripcion: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ name: 'motivo_cancelacion', type: 'text', nullable: true })
  motivoCancelacion: string;

  @Column({ name: 'motivo_reprogramacion', type: 'text', nullable: true })
  motivoReprogramacion: string;

  @Column({ type: 'varchar', length: 20, default: 'Programado' })
  estado: string;

  @Column({ name: 'estado_seguimiento', type: 'varchar', length: 30, default: 'Pendiente' })
  estadoSeguimiento: string;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamp' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion', type: 'timestamp', nullable: true })
  fechaActualizacion: Date;
}
