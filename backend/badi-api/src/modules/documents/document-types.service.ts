import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentType } from './entities/document-type.entity';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';
import { Document } from './entities/document.entity';

// ─── Datos semilla ──────────────────────────────────────────────────────────

const SEED_DOCUMENT_TYPES: Omit<
  DocumentType,
  'id' | 'fechaCreacion' | 'fechaActualizacion'
>[] = [
  {
    nombre: 'Convenio firmado',
    codigo: 'convenio-firmado',
    descripcion: 'Convenio físico firmado entre BADI y la organización.',
    origenPermitido: 'AMBOS',
    entidadesPermitidas: ['CONVENIO'],
    requiereEntidadRelacionada: true,
    permiteCargaGeneral: false,
    permiteReemplazo: true,
    esEvidencia: false,
    extensionesPermitidas: ['pdf'],
    tamanoMaximoMb: 10,
    requiereFechaDocumento: true,
    observacionesObligatorias: false,
    estado: 'Activo',
  },
  {
    nombre: 'Oficio',
    codigo: 'oficio',
    descripcion: 'Documento oficial de comunicación (solicitud, notificación, etc.).',
    origenPermitido: 'AMBOS',
    entidadesPermitidas: ['ORGANIZACION'],
    requiereEntidadRelacionada: true,
    permiteCargaGeneral: false,
    permiteReemplazo: true,
    esEvidencia: false,
    extensionesPermitidas: ['pdf', 'doc', 'docx'],
    tamanoMaximoMb: 10,
    requiereFechaDocumento: false,
    observacionesObligatorias: false,
    estado: 'Activo',
  },
  {
    nombre: 'Certificado',
    codigo: 'certificado',
    descripcion: 'Certificado emitido a la organización (RUC, calificación, etc.).',
    origenPermitido: 'AMBOS',
    entidadesPermitidas: ['ORGANIZACION'],
    requiereEntidadRelacionada: true,
    permiteCargaGeneral: false,
    permiteReemplazo: true,
    esEvidencia: false,
    extensionesPermitidas: ['pdf', 'jpg', 'png'],
    tamanoMaximoMb: 10,
    requiereFechaDocumento: false,
    observacionesObligatorias: false,
    estado: 'Activo',
  },
  {
    nombre: 'Acta de agradecimiento',
    codigo: 'acta-agradecimiento',
    descripcion: 'Acta de agradecimiento firmada por la organización.',
    origenPermitido: 'AMBOS',
    entidadesPermitidas: ['ORGANIZACION'],
    requiereEntidadRelacionada: true,
    permiteCargaGeneral: false,
    permiteReemplazo: true,
    esEvidencia: false,
    extensionesPermitidas: ['pdf', 'jpg', 'png'],
    tamanoMaximoMb: 10,
    requiereFechaDocumento: false,
    observacionesObligatorias: false,
    estado: 'Activo',
  },
  {
    nombre: 'Solicitud',
    codigo: 'solicitud',
    descripcion: 'Solicitud formal presentada por la organización o BADI.',
    origenPermitido: 'AMBOS',
    entidadesPermitidas: ['ORGANIZACION'],
    requiereEntidadRelacionada: true,
    permiteCargaGeneral: false,
    permiteReemplazo: true,
    esEvidencia: false,
    extensionesPermitidas: ['pdf', 'doc', 'docx', 'jpg', 'png'],
    tamanoMaximoMb: 10,
    requiereFechaDocumento: false,
    observacionesObligatorias: false,
    estado: 'Activo',
  },
  {
    nombre: 'Carta de desvinculación',
    codigo: 'carta-desvinculacion',
    descripcion: 'Carta que formaliza la desvinculación de la organización.',
    origenPermitido: 'AMBOS',
    entidadesPermitidas: ['ORGANIZACION'],
    requiereEntidadRelacionada: true,
    permiteCargaGeneral: false,
    permiteReemplazo: true,
    esEvidencia: false,
    extensionesPermitidas: ['pdf', 'doc', 'docx'],
    tamanoMaximoMb: 10,
    requiereFechaDocumento: false,
    observacionesObligatorias: false,
    estado: 'Activo',
  },
  {
    nombre: 'Registro fotográfico',
    codigo: 'registro-fotografico',
    descripcion: 'Fotografías de la entrega o actividad realizada.',
    origenPermitido: 'AMBOS',
    entidadesPermitidas: ['ENTREGA_REALIZADA'],
    requiereEntidadRelacionada: true,
    permiteCargaGeneral: false,
    permiteReemplazo: false,
    esEvidencia: true,
    extensionesPermitidas: ['jpg', 'jpeg', 'png', 'webp'],
    tamanoMaximoMb: 5,
    requiereFechaDocumento: false,
    observacionesObligatorias: false,
    estado: 'Activo',
  },

  {
    nombre: 'Otro',
    codigo: 'otro',
    descripcion: 'Documento que no encaja en ninguna categoría anterior.',
    origenPermitido: 'AMBOS',
    entidadesPermitidas: ['GENERAL', 'ORGANIZACION', 'CONVENIO', 'ENTREGA_REALIZADA'],
    requiereEntidadRelacionada: false,
    permiteCargaGeneral: true,
    permiteReemplazo: true,
    esEvidencia: false,
    extensionesPermitidas: ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'doc', 'docx', 'xls', 'xlsx'],
    tamanoMaximoMb: 10,
    requiereFechaDocumento: false,
    observacionesObligatorias: false,
    estado: 'Activo',
  },
];

// ─── Servicio ────────────────────────────────────────────────────────────────

@Injectable()
export class DocumentTypesService implements OnModuleInit {
  private readonly logger = new Logger(DocumentTypesService.name);

  constructor(
    @InjectRepository(DocumentType)
    private readonly documentTypeRepo: Repository<DocumentType>,
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
  ) {}

  // ── Seed ────────────────────────────────────────────────────────────────

  async onModuleInit(): Promise<void> {
    await this.seedDocumentTypes();
  }

  private async seedDocumentTypes(): Promise<void> {
    for (const seed of SEED_DOCUMENT_TYPES) {
      const existing = await this.documentTypeRepo.findOne({
        where: { codigo: seed.codigo },
      });

      if (!existing) {
        await this.documentTypeRepo.save(this.documentTypeRepo.create(seed));
        this.logger.log(`Tipo documental sembrado: ${seed.codigo}`);
      } else {
        // Actualizar entidades y reglas según la decisión funcional final
        existing.entidadesPermitidas = seed.entidadesPermitidas;
        existing.requiereEntidadRelacionada = seed.requiereEntidadRelacionada;
        existing.permiteCargaGeneral = seed.permiteCargaGeneral;
        await this.documentTypeRepo.save(existing);
        this.logger.log(`Tipo documental actualizado: ${seed.codigo}`);
      }
    }
    this.logger.log('Seed de tipos documentales completado.');
  }

  // ── CRUD ────────────────────────────────────────────────────────────────

  async findActive(): Promise<DocumentType[]> {
    return this.documentTypeRepo.find({
      where: { estado: 'Activo' },
      order: { nombre: 'ASC' },
    });
  }

  async findAll(): Promise<DocumentType[]> {
    return this.documentTypeRepo.find({ order: { nombre: 'ASC' } });
  }

  async findOne(id: string): Promise<DocumentType> {
    const tipo = await this.documentTypeRepo.findOne({ where: { id } });
    if (!tipo) {
      throw new NotFoundException(`Tipo documental con id "${id}" no encontrado.`);
    }
    return tipo;
  }

  async create(dto: CreateDocumentTypeDto): Promise<DocumentType> {
    await this.assertUniqueCode(dto.codigo);

    const tipo = this.documentTypeRepo.create({
      ...dto,
      origenPermitido: dto.origenPermitido ?? 'AMBOS',
      tamanoMaximoMb: dto.tamanoMaximoMb ?? 10,
      requiereEntidadRelacionada: dto.requiereEntidadRelacionada ?? false,
      permiteCargaGeneral: dto.permiteCargaGeneral ?? true,
      permiteReemplazo: dto.permiteReemplazo ?? true,
      esEvidencia: dto.esEvidencia ?? false,
      requiereFechaDocumento: dto.requiereFechaDocumento ?? false,
      observacionesObligatorias: dto.observacionesObligatorias ?? false,
      estado: 'Activo',
    });

    return this.documentTypeRepo.save(tipo);
  }

  async update(id: string, dto: UpdateDocumentTypeDto): Promise<DocumentType> {
    const tipo = await this.findOne(id);

    if (dto.codigo && dto.codigo !== tipo.codigo) {
      await this.assertUniqueCode(dto.codigo);
    }

    Object.assign(tipo, dto);
    return this.documentTypeRepo.save(tipo);
  }

  async deactivate(id: string): Promise<DocumentType> {
    const tipo = await this.findOne(id);
    if (tipo.estado === 'Inactivo') {
      throw new BadRequestException('El tipo documental ya está inactivo.');
    }
    tipo.estado = 'Inactivo';
    return this.documentTypeRepo.save(tipo);
  }

  async activate(id: string): Promise<DocumentType> {
    const tipo = await this.findOne(id);
    if (tipo.estado === 'Activo') {
      throw new BadRequestException('El tipo documental ya está activo.');
    }
    tipo.estado = 'Activo';
    return this.documentTypeRepo.save(tipo);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private async assertUniqueCode(codigo: string): Promise<void> {
    const existing = await this.documentTypeRepo.findOne({ where: { codigo } });
    if (existing) {
      throw new ConflictException(
        `Ya existe un tipo documental con el código "${codigo}".`,
      );
    }
  }
}
