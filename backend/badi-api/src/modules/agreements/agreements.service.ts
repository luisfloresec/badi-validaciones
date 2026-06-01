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
    const types = await this.agreementTypesRepository.find();
    if (types.length === 0) {
      console.log('AgreementsService: Inicializando tipos de convenio por defecto...');
      const piloto = new AgreementType();
      piloto.nombre = 'Convenio Piloto';
      piloto.descripcion = 'Convenio piloto inicial';
      
      const vinculado = new AgreementType();
      vinculado.nombre = 'Convenio Vinculado';
      vinculado.descripcion = 'Convenio de vinculación formal';

      await this.agreementTypesRepository.save([piloto, vinculado]);
      console.log('AgreementsService: Tipos de convenio creados.');
    }
  }

  async findTypes() {
    return this.agreementTypesRepository.find({
      where: { estado: 'Activo' },
      order: { nombre: 'ASC' },
    });
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

  async deactivate(id: string) {
    const agreement = await this.findOne(id);
    if (agreement.estado === 'Anulado' || agreement.estado === 'Inactivo') {
      throw new BadRequestException('El convenio ya se encuentra anulado o inactivo');
    }
    agreement.estado = 'Anulado';
    return this.agreementsRepository.save(agreement);
  }
}
