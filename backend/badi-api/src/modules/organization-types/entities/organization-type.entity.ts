import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tipo_organizacion')
export class OrganizationType {
  @PrimaryGeneratedColumn('uuid', { name: 'id_tipo_organizacion' })
  id: string;

  @Column({ type: 'varchar', length: 80, unique: true })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'varchar', length: 20, default: 'Activo' })
  estado: string;
}
