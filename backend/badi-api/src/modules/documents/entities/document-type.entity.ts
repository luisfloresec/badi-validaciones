import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tipo_documento')
export class DocumentType {
  @PrimaryGeneratedColumn('uuid', { name: 'id_tipo_documento' })
  id: string;

  @Column({ type: 'varchar', length: 120, nullable: false })
  nombre: string;

  @Column({ type: 'varchar', length: 60, unique: true, nullable: false })
  codigo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  /**
   * MODULO | GESTION_DOCUMENTAL | AMBOS
   * Indica si este tipo puede usarse desde un módulo externo, solo desde Gestión Documental, o ambos.
   */
  @Column({
    name: 'origen_permitido',
    type: 'varchar',
    length: 20,
    default: 'AMBOS',
  })
  origenPermitido: string;

  /**
   * Array de strings: ["ORGANIZACION", "CONVENIO", "ENTREGA_REALIZADA", "GENERAL"]
   */
  @Column({
    name: 'entidades_permitidas',
    type: 'jsonb',
    default: [],
  })
  entidadesPermitidas: string[];

  @Column({
    name: 'requiere_entidad_relacionada',
    type: 'boolean',
    default: false,
  })
  requiereEntidadRelacionada: boolean;

  @Column({
    name: 'permite_carga_general',
    type: 'boolean',
    default: true,
  })
  permiteCargaGeneral: boolean;

  @Column({
    name: 'permite_reemplazo',
    type: 'boolean',
    default: true,
  })
  permiteReemplazo: boolean;

  @Column({
    name: 'es_evidencia',
    type: 'boolean',
    default: false,
  })
  esEvidencia: boolean;

  /**
   * Array de extensiones permitidas: ["pdf", "jpg", "png"]
   */
  @Column({
    name: 'extensiones_permitidas',
    type: 'jsonb',
    default: ['pdf'],
  })
  extensionesPermitidas: string[];

  @Column({
    name: 'tamano_maximo_mb',
    type: 'int',
    default: 10,
  })
  tamanoMaximoMb: number;

  @Column({
    name: 'requiere_fecha_documento',
    type: 'boolean',
    default: false,
  })
  requiereFechaDocumento: boolean;

  @Column({
    name: 'observaciones_obligatorias',
    type: 'boolean',
    default: false,
  })
  observacionesObligatorias: boolean;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'Activo',
  })
  estado: string;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamp' })
  fechaCreacion: Date;

  @UpdateDateColumn({
    name: 'fecha_actualizacion',
    type: 'timestamp',
    nullable: true,
  })
  fechaActualizacion: Date;
}
