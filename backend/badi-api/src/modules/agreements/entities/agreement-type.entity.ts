import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tipo_convenio')
export class AgreementType {
  @PrimaryGeneratedColumn('uuid', { name: 'id_tipo_convenio' })
  id: string;

  @Column({ type: 'varchar', length: 120 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ name: 'duracion_meses', type: 'int', nullable: true })
  duracionMeses: number | null;

  @Column({ name: 'max_retiros', type: 'int', nullable: true })
  maxRetiros: number | null;

  @Column({ type: 'varchar', length: 20, default: 'Activo' })
  estado: string;
}
