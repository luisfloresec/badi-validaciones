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
import { ScheduledDelivery } from '../../schedules/entities/scheduled-delivery.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('entrega_realizada')
export class RealizedDelivery {
  @PrimaryGeneratedColumn('uuid', { name: 'id_entrega_realizada' })
  id: string;

  @ManyToOne(() => ScheduledDelivery, { nullable: false })
  @JoinColumn({ name: 'id_entrega_programada' })
  entregaProgramada: ScheduledDelivery;

  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: 'id_organizacion' })
  organizacion: Organization;

  @ManyToOne(() => Agreement, { nullable: true })
  @JoinColumn({ name: 'id_convenio' })
  convenio: Agreement | null;

  @Column({ name: 'fecha_realizacion', type: 'date' })
  fechaRealizacion: Date;

  @Column({ name: 'kilos_entregados', type: 'numeric', precision: 10, scale: 2 })
  kilosEntregados: number;

  @Column({ name: 'personas_atendidas', type: 'int' })
  personasAtendidas: number;

  @Column({ name: 'beneficiarios_atendidos', type: 'int', nullable: true })
  beneficiariosAtendidos: number | null;

  @Column({ name: 'cuota', type: 'numeric', precision: 10, scale: 2, nullable: true })
  cuota: number | null;

  @Column({ name: 'detalle_productos', type: 'text', nullable: true })
  detalleProductos: string | null;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @Column({ type: 'varchar', length: 20, default: 'Registrada' })
  estado: string;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamp' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion', type: 'timestamp', nullable: true })
  fechaActualizacion: Date;
}
