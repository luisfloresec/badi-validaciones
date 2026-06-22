import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Document } from './entities/document.entity';
import { DocumentType } from './entities/document-type.entity';
import { R2StorageService } from './r2-storage.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { ReplaceDocumentDto } from './dto/replace-document.dto';
import { DocumentFiltersDto } from './dto/document-filters.dto';
import { EntityType } from './enums/entity-type.enum';
import { DocumentStatus } from './enums/document-status.enum';
import { Organization } from '../organizations/entities/organization.entity';
import { Agreement } from '../agreements/entities/agreement.entity';
import { Readable } from 'stream';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
    @InjectRepository(DocumentType)
    private readonly documentTypeRepo: Repository<DocumentType>,
    @InjectRepository(Organization)
    private readonly organizationRepo: Repository<Organization>,
    @InjectRepository(Agreement)
    private readonly agreementRepo: Repository<Agreement>,
    private readonly r2Storage: R2StorageService,
  ) {}

  async upload(dto: CreateDocumentDto, file: Express.Multer.File): Promise<Document> {
    if (!file) {
      throw new BadRequestException('El archivo es obligatorio.');
    }

    const tipoDoc = await this.documentTypeRepo.findOne({
      where: { id: dto.tipoDocumentoId, estado: 'Activo' },
    });

    if (!tipoDoc) {
      throw new NotFoundException('Tipo documental no encontrado o inactivo.');
    }

    // 1. Validar extensión
    const ext = extname(file.originalname).toLowerCase().replace('.', '');
    if (!tipoDoc.extensionesPermitidas.includes(ext)) {
      throw new BadRequestException(
        `Extensión no permitida para este tipo documental. Permitidas: ${tipoDoc.extensionesPermitidas.join(', ')}`,
      );
    }

    // 2. Validar tamaño
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > tipoDoc.tamanoMaximoMb) {
      throw new BadRequestException(
        `El archivo excede el tamaño máximo permitido de ${tipoDoc.tamanoMaximoMb} MB.`,
      );
    }

    // 3. Validar reglas de entidad
    if (tipoDoc.requiereEntidadRelacionada) {
      if (!dto.entidadRelacionada || !dto.idEntidadRelacionada) {
        throw new BadRequestException(
          'Este tipo documental requiere una entidad relacionada (entidadRelacionada e idEntidadRelacionada).',
        );
      }
    }

    if (dto.entidadRelacionada && dto.entidadRelacionada !== EntityType.GENERAL) {
      if (!tipoDoc.entidadesPermitidas.includes(dto.entidadRelacionada)) {
        throw new BadRequestException(
          `Este tipo documental no permite asociarse a la entidad ${dto.entidadRelacionada}.`,
        );
      }
      
      if (!dto.idEntidadRelacionada) {
        throw new BadRequestException('idEntidadRelacionada es requerido si se envía entidadRelacionada');
      }
      
      // Verificar existencia de la entidad en BD
      await this.verifyEntityExists(dto.entidadRelacionada, dto.idEntidadRelacionada);
    } else if (!tipoDoc.permiteCargaGeneral && dto.entidadRelacionada === EntityType.GENERAL) {
      throw new BadRequestException('Este tipo documental no permite carga general sin entidad asociada.');
    }

    // 4. Construir object key
    const fileUuid = uuidv4();
    const objectKey = this.buildObjectKey(dto.entidadRelacionada, dto.idEntidadRelacionada, tipoDoc.codigo, fileUuid, ext);

    // 5. Subir a R2
    await this.r2Storage.upload(objectKey, file.buffer, file.mimetype);

    // 6. Guardar en BD
    const document = this.documentRepo.create({
      tipoDocumento: tipoDoc,
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      observaciones: dto.observaciones,
      nombreOriginal: file.originalname,
      nombreArchivo: `${fileUuid}.${ext}`,
      mimeType: file.mimetype,
      extension: ext,
      tamanoBytes: file.size,
      bucket: process.env.R2_BUCKET_NAME || 'badi-documentos',
      objectKey,
      entidadRelacionada: dto.entidadRelacionada,
      idEntidadRelacionada: dto.idEntidadRelacionada,
      origenCarga: dto.origenCarga,
      fechaDocumento: dto.fechaDocumento ? new Date(dto.fechaDocumento) : null,
    });

    return this.documentRepo.save(document);
  }

  async getDownloadStream(id: string): Promise<{ stream: Readable; document: Document }> {
    const document = await this.documentRepo.findOne({ where: { id } });
    if (!document) {
      throw new NotFoundException('Documento no encontrado.');
    }

    const stream = await this.r2Storage.download(document.objectKey);
    return { stream, document };
  }

  async findAll(filters: DocumentFiltersDto): Promise<{ data: Document[]; total: number; page: number; limit: number }> {
    const { search, tipoDocumentoId, entidadRelacionada, idEntidadRelacionada, estado, mostrarAnulados, page = 1, limit = 10 } = filters;
    const query = this.documentRepo.createQueryBuilder('doc')
      .leftJoinAndSelect('doc.tipoDocumento', 'tipoDocumento')
      .orderBy('doc.fechaCarga', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      query.andWhere('(doc.titulo ILIKE :search OR doc.nombreOriginal ILIKE :search)', { search: `%${search}%` });
    }
    if (tipoDocumentoId) {
      query.andWhere('tipoDocumento.id = :tipoDocumentoId', { tipoDocumentoId });
    }
    if (entidadRelacionada) {
      query.andWhere('doc.entidadRelacionada = :entidadRelacionada', { entidadRelacionada });
    }
    if (idEntidadRelacionada) {
      query.andWhere('doc.idEntidadRelacionada = :idEntidadRelacionada', { idEntidadRelacionada });
    }
    if (estado) {
      query.andWhere('doc.estado = :estado', { estado });
    } else if (!mostrarAnulados) {
      // Si no se especifica estado y tampoco se pide mostrar anulados, excluimos los anulados
      query.andWhere('doc.estado != :estadoAnulado', { estadoAnulado: DocumentStatus.ANULADO });
    }

    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit };
  }

  async getStats() {
    const total = await this.documentRepo.count();
    
    const byStatusRaw = await this.documentRepo.createQueryBuilder('doc')
      .select('doc.estado', 'estado')
      .addSelect('COUNT(*)', 'count')
      .groupBy('doc.estado')
      .getRawMany();

    const byTypeRaw = await this.documentRepo.createQueryBuilder('doc')
      .leftJoin('doc.tipoDocumento', 'tipoDocumento')
      .select('tipoDocumento.nombre', 'tipo')
      .addSelect('COUNT(*)', 'count')
      .groupBy('tipoDocumento.id')
      .getRawMany();
      
    const sizeRaw = await this.documentRepo.createQueryBuilder('doc')
      .select('SUM(doc.tamanoBytes)', 'totalBytes')
      .getRawOne();

    return {
      total,
      byStatus: byStatusRaw.map(b => ({ estado: b.estado, count: parseInt(b.count, 10) })),
      byType: byTypeRaw.map(b => ({ tipo: b.tipo, count: parseInt(b.count, 10) })),
      totalBytes: parseInt(sizeRaw?.totalBytes || '0', 10),
    };
  }

  async findOne(id: string): Promise<Document> {
    const doc = await this.documentRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    return doc;
  }

  async update(id: string, dto: UpdateDocumentDto): Promise<Document> {
    const doc = await this.findOne(id);
    if (dto.titulo) doc.titulo = dto.titulo;
    if (dto.descripcion !== undefined) doc.descripcion = dto.descripcion;
    if (dto.fechaDocumento !== undefined) doc.fechaDocumento = dto.fechaDocumento ? new Date(dto.fechaDocumento) : null;
    if (dto.observaciones !== undefined) doc.observaciones = dto.observaciones;
    
    return this.documentRepo.save(doc);
  }

  async deactivate(id: string): Promise<Document> {
    const doc = await this.findOne(id);
    doc.estado = DocumentStatus.INACTIVO;
    return this.documentRepo.save(doc);
  }

  async annul(id: string): Promise<Document> {
    const doc = await this.findOne(id);
    doc.estado = DocumentStatus.ANULADO;
    return this.documentRepo.save(doc);
  }

  async replace(id: string, dto: ReplaceDocumentDto, file: Express.Multer.File): Promise<Document> {
    const oldDoc = await this.findOne(id);
    if (oldDoc.estado === DocumentStatus.REEMPLAZADO) {
      throw new BadRequestException('El documento ya fue reemplazado.');
    }

    const createDto: CreateDocumentDto = {
      tipoDocumentoId: oldDoc.tipoDocumento.id,
      titulo: oldDoc.titulo,
      descripcion: oldDoc.descripcion || undefined,
      entidadRelacionada: oldDoc.entidadRelacionada || undefined,
      idEntidadRelacionada: oldDoc.idEntidadRelacionada || undefined,
      origenCarga: oldDoc.origenCarga,
      fechaDocumento: this.normalizeDateOnly(oldDoc.fechaDocumento) || undefined,
      observaciones: oldDoc.observaciones || undefined,
    };

    const newDoc = await this.upload(createDto, file);
    
    newDoc.idDocumentoReemplazado = oldDoc.id;
    newDoc.motivoReemplazo = dto.motivoReemplazo;
    await this.documentRepo.save(newDoc);

    oldDoc.estado = DocumentStatus.REEMPLAZADO;
    await this.documentRepo.save(oldDoc);

    return newDoc;
  }

  // --- Helpers ---

  private normalizeDateOnly(value: Date | string | null | undefined): string | null {
    if (!value) return null;
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    return String(value).slice(0, 10);
  }

  private async verifyEntityExists(entityType: EntityType, id: string): Promise<void> {
    if (!id) throw new BadRequestException('Falta idEntidadRelacionada');

    if (entityType === EntityType.ORGANIZACION) {
      const exists = await this.organizationRepo.findOne({ where: { id } });
      if (!exists) throw new NotFoundException(`Organización con id ${id} no encontrada.`);
    } else if (entityType === EntityType.CONVENIO) {
      const exists = await this.agreementRepo.findOne({ where: { id } });
      if (!exists) throw new NotFoundException(`Convenio con id ${id} no encontrado.`);
    } else if (entityType === EntityType.ENTREGA_REALIZADA) {
      // TODO: Implementar cuando exista la entidad EntregaRealizada
      this.logger.warn('Validación de EntregaRealizada omitida (entidad no implementada aún).');
    }
  }

  private buildObjectKey(
    entityType: EntityType | undefined,
    entityId: string | undefined,
    typeCode: string,
    uuid: string,
    ext: string,
  ): string {
    const folder = entityType ? entityType.toLowerCase().replace('_', '-') : 'general';
    const subfolder = entityId ? `${entityId}/${typeCode}` : typeCode;
    return `${folder}/${subfolder}/${uuid}.${ext}`;
  }
}
