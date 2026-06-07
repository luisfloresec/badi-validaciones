import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agreement } from './entities/agreement.entity';
import { AgreementType } from './entities/agreement-type.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { UpdateAgreementDto } from './dto/update-agreement.dto';
import { CreateAgreementTypeDto } from './dto/create-agreement-type.dto';
import { UpdateAgreementTypeDto } from './dto/update-agreement-type.dto';
import { Not } from 'typeorm';

@Injectable()
export class AgreementsService implements OnModuleInit {
  constructor(
    @InjectRepository(Agreement)
    private readonly agreementsRepository: Repository<Agreement>,
    @InjectRepository(AgreementType)
    private readonly agreementTypesRepository: Repository<AgreementType>,
    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>,
  ) {}

  async onModuleInit() {
    // Upsert tipos iniciales sin duplicar
    const seedTypes = [
      {
        nombre: 'Convenio Piloto',
        descripcion: 'Convenio piloto inicial',
        duracionMeses: null as number | null,
        maxRetiros: 4,
        estado: 'Activo',
      },
      {
        nombre: 'Convenio Vinculado',
        descripcion: 'Convenio de vinculación formal',
        duracionMeses: 12,
        maxRetiros: null as number | null,
        estado: 'Activo',
      },
    ];

    for (const seed of seedTypes) {
      let existing = await this.agreementTypesRepository.findOne({
        where: { nombre: seed.nombre },
      });
      if (existing) {
        existing.descripcion = seed.descripcion;
        existing.duracionMeses = seed.duracionMeses;
        existing.maxRetiros = seed.maxRetiros;
        existing.estado = seed.estado;
        await this.agreementTypesRepository.save(existing);
      } else {
        const newType = new AgreementType();
        newType.nombre = seed.nombre;
        newType.descripcion = seed.descripcion;
        newType.duracionMeses = seed.duracionMeses;
        newType.maxRetiros = seed.maxRetiros;
        newType.estado = seed.estado;
        await this.agreementTypesRepository.save(newType);
      }
    }
    console.log('AgreementsService: Tipos de convenio sincronizados.');
  }

  async findTypes() {
    return this.agreementTypesRepository.find({
      where: { estado: 'Activo' },
      order: { nombre: 'ASC' },
    });
  }

  async findAllTypes() {
    return this.agreementTypesRepository.find({
      order: { nombre: 'ASC' },
    });
  }

  async findTypeById(id: string) {
    const type = await this.agreementTypesRepository.findOne({ where: { id } });
    if (!type) throw new NotFoundException('Tipo de convenio no encontrado');
    return type;
  }

  async createType(createDto: CreateAgreementTypeDto) {
    const existing = await this.agreementTypesRepository.findOne({
      where: { nombre: createDto.nombre.trim() }
    });
    if (existing) {
      throw new BadRequestException('Ya existe un tipo de convenio con este nombre.');
    }
    const newType = new AgreementType();
    newType.nombre = createDto.nombre.trim();
    newType.descripcion = createDto.descripcion ?? null as any;
    newType.duracionMeses = createDto.duracionMeses ?? null;
    newType.maxRetiros = createDto.maxRetiros ?? null;
    newType.estado = 'Activo';
    return this.agreementTypesRepository.save(newType);
  }

  async updateType(id: string, updateDto: UpdateAgreementTypeDto) {
    const type = await this.findTypeById(id);

    if (updateDto.nombre && updateDto.nombre.trim() !== type.nombre) {
      const existing = await this.agreementTypesRepository.findOne({
        where: { nombre: updateDto.nombre.trim(), id: Not(id) }
      });
      if (existing) {
        throw new BadRequestException('Ya existe un tipo de convenio con este nombre.');
      }
      type.nombre = updateDto.nombre.trim();
    }

    if (updateDto.descripcion !== undefined) {
      type.descripcion = updateDto.descripcion ?? null as any;
    }

    // Check if we are modifying rules (duracionMeses, maxRetiros)
    const modifyingRules = 
      (updateDto.duracionMeses !== undefined && updateDto.duracionMeses !== type.duracionMeses) ||
      (updateDto.maxRetiros !== undefined && updateDto.maxRetiros !== type.maxRetiros);

    if (modifyingRules) {
      // Bloquear si hay convenios activos
      const activeAgreementsCount = await this.agreementsRepository.count({
        where: { tipoConvenio: { id }, estado: 'Activo' }
      });
      if (activeAgreementsCount > 0) {
        throw new BadRequestException('No se pueden modificar las reglas (duración o retiros) porque existen convenios Activos asociados a este tipo.');
      }

      if (updateDto.duracionMeses !== undefined) type.duracionMeses = updateDto.duracionMeses ?? null;
      if (updateDto.maxRetiros !== undefined) type.maxRetiros = updateDto.maxRetiros ?? null;
    }

    return this.agreementTypesRepository.save(type);
  }

  async deactivateType(id: string) {
    const type = await this.findTypeById(id);
    if (type.estado === 'Inactivo') throw new BadRequestException('El tipo ya se encuentra inactivo.');
    type.estado = 'Inactivo';
    return this.agreementTypesRepository.save(type);
  }

  async activateType(id: string) {
    const type = await this.findTypeById(id);
    if (type.estado === 'Activo') throw new BadRequestException('El tipo ya se encuentra activo.');
    type.estado = 'Activo';
    return this.agreementTypesRepository.save(type);
  }

  async findAll() {
    return this.agreementsRepository.find({
      relations: { organizacion: true, tipoConvenio: true },
      order: { fechaCreacion: 'DESC' },
    });
  }

  async findOne(id: string) {
    const agreement = await this.agreementsRepository.findOne({
      where: { id },
      relations: { organizacion: true, tipoConvenio: true },
    });
    if (!agreement) {
      throw new NotFoundException('Convenio no encontrado');
    }
    return agreement;
  }

  private async checkUniqueCode(code: string, excludeId?: string) {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      throw new BadRequestException('El código del convenio no puede estar vacío');
    }
    const whereClause: any = { codigoConvenio: trimmedCode };
    if (excludeId) {
      whereClause.id = Not(excludeId);
    }
    const existing = await this.agreementsRepository.findOne({ where: whereClause });
    if (existing) {
      throw new BadRequestException('Ya existe un convenio registrado con este código.');
    }
    return trimmedCode;
  }

  async create(createDto: CreateAgreementDto) {
    const organization = await this.organizationsRepository.findOne({
      where: { id: createDto.organizationId },
    });
    if (!organization) {
      throw new NotFoundException('Organización no encontrada');
    }
    if (organization.estado === 'Inactiva') {
      throw new BadRequestException('No se puede crear un convenio en una organización inactiva');
    }

    const tipoConvenio = await this.agreementTypesRepository.findOne({
      where: { id: createDto.tipoConvenioId, estado: 'Activo' },
    });
    if (!tipoConvenio) {
      throw new NotFoundException('Tipo de convenio no encontrado o inactivo');
    }

    const agreement = new Agreement();
    agreement.organizacion = organization;
    agreement.tipoConvenio = tipoConvenio;
    agreement.estado = 'Registrado';
    agreement.retirosRealizados = 0;

    if (createDto.codigoConvenio) {
      agreement.codigoConvenio = await this.checkUniqueCode(createDto.codigoConvenio);
    } else {
      throw new BadRequestException('El código del convenio es obligatorio.');
    }

    if (createDto.fechaInicio) {
      agreement.fechaInicio = new Date(createDto.fechaInicio);
    }
    if (createDto.observaciones) {
      agreement.observaciones = createDto.observaciones;
    }

    return this.agreementsRepository.save(agreement);
  }

  async update(id: string, updateDto: UpdateAgreementDto) {
    const agreement = await this.findOne(id);

    // Reglas de edición según estado
    if (agreement.estado === 'Anulado') {
      throw new BadRequestException('No se puede editar un convenio anulado.');
    }
    if (agreement.estado === 'Finalizado') {
      throw new BadRequestException('No se puede editar un convenio finalizado.');
    }

    if (agreement.estado === 'Activo') {
      // No permitir cambiar tipo si está Activo
      if (updateDto.tipoConvenioId && updateDto.tipoConvenioId !== agreement.tipoConvenio.id) {
        throw new BadRequestException(
          'No se puede cambiar el tipo de convenio cuando está Activo. El tipo define las reglas de vigencia aplicadas.'
        );
      }
      // No permitir cambiar código si está Activo
      if (updateDto.codigoConvenio !== undefined && updateDto.codigoConvenio !== agreement.codigoConvenio) {
        throw new BadRequestException(
          'No se puede cambiar el código de un convenio activo, ya que es un identificador documental activado.'
        );
      }
      // Solo permitir observaciones en estado Activo
      if (updateDto.observaciones !== undefined) {
        agreement.observaciones = updateDto.observaciones;
      }
      return this.agreementsRepository.save(agreement);
    }

    // Estado Registrado: edición completa permitida
    if (updateDto.tipoConvenioId) {
      const tipoConvenio = await this.agreementTypesRepository.findOne({
        where: { id: updateDto.tipoConvenioId, estado: 'Activo' },
      });
      if (!tipoConvenio) {
        throw new NotFoundException('Tipo de convenio no encontrado o inactivo');
      }
      agreement.tipoConvenio = tipoConvenio;
    }

    if (updateDto.codigoConvenio !== undefined) {
      if (!updateDto.codigoConvenio) {
        throw new BadRequestException('El código del convenio es obligatorio.');
      }
      agreement.codigoConvenio = await this.checkUniqueCode(updateDto.codigoConvenio, id);
    }

    if (updateDto.fechaInicio !== undefined) {
      agreement.fechaInicio = updateDto.fechaInicio ? new Date(updateDto.fechaInicio) : null as any;
    }

    if (updateDto.observaciones !== undefined) {
      agreement.observaciones = updateDto.observaciones;
    }

    return this.agreementsRepository.save(agreement);
  }

  async activate(id: string) {
    const agreement = await this.findOne(id);

    if (agreement.estado === 'Activo') {
      throw new BadRequestException('El convenio ya se encuentra activo.');
    }
    if (agreement.estado === 'Anulado') {
      throw new BadRequestException('No se puede activar un convenio anulado.');
    }
    if (agreement.estado === 'Finalizado') {
      throw new BadRequestException('No se puede activar un convenio finalizado.');
    }
    if (agreement.estado !== 'Registrado') {
      throw new BadRequestException('Solo se puede activar un convenio en estado Registrado.');
    }

    if (!agreement.tipoConvenio) {
      throw new BadRequestException('El convenio debe tener un tipo de convenio asignado para poder activarse.');
    }

    const now = new Date();
    agreement.fechaActivacion = now;
    agreement.estado = 'Activo';

    if (agreement.retirosRealizados === null || agreement.retirosRealizados === undefined) {
      agreement.retirosRealizados = 0;
    }

    // Calcular fechaFinEstimada si el tipo tiene duracionMeses
    if (agreement.tipoConvenio.duracionMeses) {
      const fechaFin = new Date(now);
      fechaFin.setMonth(fechaFin.getMonth() + agreement.tipoConvenio.duracionMeses);
      agreement.fechaFinEstimada = fechaFin;
    } else {
      agreement.fechaFinEstimada = null as any;
    }

    return this.agreementsRepository.save(agreement);
  }

  async finalize(id: string, motivo?: string) {
    const agreement = await this.findOne(id);

    if (agreement.estado !== 'Activo') {
      throw new BadRequestException(
        `Solo se puede finalizar un convenio en estado Activo. Estado actual: ${agreement.estado}.`
      );
    }

    agreement.estado = 'Finalizado';
    agreement.fechaFinalizacion = new Date();

    if (motivo) {
      // Append motivo to observaciones
      const prefix = agreement.observaciones ? agreement.observaciones + '\n' : '';
      agreement.observaciones = prefix + `[Finalización] ${motivo}`;
    }

    return this.agreementsRepository.save(agreement);
  }

  async deactivate(id: string) {
    const agreement = await this.findOne(id);

    if (agreement.estado === 'Anulado') {
      throw new BadRequestException('El convenio ya se encuentra anulado.');
    }
    if (agreement.estado === 'Finalizado') {
      throw new BadRequestException('No se puede anular un convenio ya finalizado.');
    }
    if (agreement.estado !== 'Registrado' && agreement.estado !== 'Activo') {
      throw new BadRequestException('Solo se puede anular un convenio en estado Registrado o Activo.');
    }

    agreement.estado = 'Anulado';
    return this.agreementsRepository.save(agreement);
  }
}
