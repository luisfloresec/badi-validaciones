import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DocumentType } from './document-type.entity';
import { DocumentStatus } from '../enums/document-status.enum';
import { EntityType } from '../enums/entity-type.enum';
import { UploadOrigin } from '../enums/upload-origin.enum';

@Entity('documento')
export class Document {
  @PrimaryGeneratedColumn('uuid', { name: 'id_documento' })
  id: string;

  @ManyToOne(() => DocumentType, { nullable: false, eager: true })
  @JoinColumn({ name: 'id_tipo_documento' })
  tipoDocumento: DocumentType;

  @Column({ type: 'varchar', length: 300, nullable: false })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'nombre_original', type: 'varchar', length: 255 })
  nombreOriginal: string;

  @Column({ name: 'nombre_archivo', type: 'varchar', length: 255 })
  nombreArchivo: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'varchar', length: 10 })
  extension: string;

  @Column({ name: 'tamano_bytes', type: 'int' })
  tamanoBytes: number;

  @Column({
    name: 'proveedor_almacenamiento',
    type: 'varchar',
    length: 30,
    default: 'CLOUDFLARE_R2',
  })
  proveedorAlmacenamiento: string;

  @Column({ type: 'varchar', length: 120 })
  bucket: string;

  @Column({ name: 'object_key', type: 'varchar', length: 500 })
  objectKey: string;

  /**
   * Tipo de entidad relacionada (polimórfico): ORGANIZACION | CONVENIO | ENTREGA_REALIZADA | GENERAL
   */
  @Column({
    name: 'entidad_relacionada',
    type: 'varchar',
    length: 30,
    nullable: true,
    enum: EntityType,
  })
  entidadRelacionada: EntityType | null;

  /**
   * UUID de la entidad relacionada (organización, convenio, etc.). Null si es GENERAL.
   */
  @Column({
    name: 'id_entidad_relacionada',
    type: 'uuid',
    nullable: true,
  })
  idEntidadRelacionada: string | null;

  @Column({
    name: 'origen_carga',
    type: 'varchar',
    length: 30,
    default: UploadOrigin.GESTION_DOCUMENTAL,
    enum: UploadOrigin,
  })
  origenCarga: UploadOrigin;

  @Column({
    type: 'varchar',
    length: 20,
    default: DocumentStatus.ACTIVO,
    enum: DocumentStatus,
  })
  estado: DocumentStatus;

  @Column({ name: 'fecha_documento', type: 'date', nullable: true })
  fechaDocumento: Date | null;

  @Column({ name: 'motivo_reemplazo', type: 'text', nullable: true })
  motivoReemplazo: string | null;

  /**
   * Auto-referencia: apunta al documento que fue reemplazado por este.
   */
  @Column({
    name: 'id_documento_reemplazado',
    type: 'uuid',
    nullable: true,
  })
  idDocumentoReemplazado: string | null;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @CreateDateColumn({ name: 'fecha_carga', type: 'timestamp' })
  fechaCarga: Date;

  @UpdateDateColumn({
    name: 'fecha_actualizacion',
    type: 'timestamp',
    nullable: true,
  })
  fechaActualizacion: Date;
}
