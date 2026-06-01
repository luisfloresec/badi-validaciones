import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tipo_convenio')
export class AgreementType {
  @PrimaryGeneratedColumn('uuid', { name: 'id_tipo_convenio' })
  id: string;

  @Column({ type: 'varchar', length: 120 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'varchar', length: 20, default: 'Activo' })
  estado: string;
}
