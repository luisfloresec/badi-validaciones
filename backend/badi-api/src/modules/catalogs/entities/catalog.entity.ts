import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('catalogo_parametrico')
export class Catalog {
  @PrimaryGeneratedColumn('uuid', { name: 'id_catalogo' })
  id: string;

  @Column({ name: 'tipo_catalogo', type: 'varchar', length: 60 })
  tipoCatalogo: string;

  @Column({ type: 'varchar', length: 120 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'varchar', length: 20, default: 'Activo' })
  estado: string;
}
