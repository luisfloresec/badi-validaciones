import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendedGroup } from './entities/attended-group.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Catalog } from '../catalogs/entities/catalog.entity';
import { CreateAttendedGroupDto } from './dto/create-attended-group.dto';
import { UpdateAttendedGroupDto } from './dto/update-attended-group.dto';

@Injectable()
export class AttendedGroupsService {
  constructor(
    @InjectRepository(AttendedGroup)
    private readonly attendedGroupsRepository: Repository<AttendedGroup>,

    @InjectRepository(Organization)
    private readonly orgsRepository: Repository<Organization>,

    @InjectRepository(Catalog)
    private readonly catalogsRepository: Repository<Catalog>,
  ) {}

  /**
   * Valida que un catálogo exista, esté Activo y corresponda al tipo esperado.
   */
  private async validateCatalog(
    id: string,
    expectedType: string,
    fieldName: string,
  ): Promise<Catalog> {
    const catalog = await this.catalogsRepository.findOne({ where: { id } });
    if (!catalog) {
      throw new NotFoundException(
        `Catálogo con id ${id} no encontrado para ${fieldName}.`,
      );
    }
    if (catalog.estado !== 'Activo') {
      throw new ConflictException(
        `El catálogo ${fieldName} no está activo.`,
      );
    }
    if (catalog.tipoCatalogo !== expectedType) {
      throw new BadRequestException(
        `El catálogo ${fieldName} debe ser de tipo ${expectedType}, pero es ${catalog.tipoCatalogo}.`,
      );
    }
    return catalog;
  }

  /**
   * Crea un nuevo grupo atendido con estado Activo.
   * Valida que la organización exista y no esté Inactiva.
   * Valida catálogos de grupo etario y vulnerabilidad.
   */
  async create(createDto: CreateAttendedGroupDto): Promise<AttendedGroup> {
    // Validar organización
    const org = await this.orgsRepository.findOne({
      where: { id: createDto.organizationId },
    });
    if (!org) {
      throw new NotFoundException(
        `Organización con id ${createDto.organizationId} no encontrada.`,
      );
    }
    if (org.estado === 'Inactiva') {
      throw new ConflictException(
        'No se puede crear un grupo atendido para una organización inactiva.',
      );
    }

    // Validar catálogos
    const grupoEtario = await this.validateCatalog(
      createDto.grupoEtarioId,
      'grupo_etario',
      'grupoEtarioId',
    );
    const vulnerabilidad = await this.validateCatalog(
      createDto.vulnerabilidadId,
      'vulnerabilidad',
      'vulnerabilidadId',
    );

    // Construir la entidad
    const group = new AttendedGroup();
    group.organizacion = org;
    group.nombre = createDto.nombre;
    group.grupoEtario = grupoEtario;
    group.vulnerabilidad = vulnerabilidad;
    group.numeroPersonas = createDto.numeroPersonas;
    group.estado = 'Activo';

    if (createDto.observaciones !== undefined) {
      group.observaciones = createDto.observaciones;
    }

    return this.attendedGroupsRepository.save(group);
  }

  /**
   * Lista todos los grupos atendidos con estado Activo.
   */
  async findAll(): Promise<AttendedGroup[]> {
    return this.attendedGroupsRepository.find({
      where: { estado: 'Activo' },
    });
  }

  /**
   * Lista grupos atendidos activos de una organización específica.
   */
  async findByOrganization(organizationId: string): Promise<AttendedGroup[]> {
    const org = await this.orgsRepository.findOne({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException(
        `Organización con id ${organizationId} no encontrada.`,
      );
    }

    return this.attendedGroupsRepository.find({
      where: {
        organizacion: { id: organizationId },
        estado: 'Activo',
      },
    });
  }

  /**
   * Busca un grupo atendido por su UUID.
   * Lanza NotFoundException si no existe.
   */
  async findOne(id: string): Promise<AttendedGroup> {
    const group = await this.attendedGroupsRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException(`Grupo atendido con id ${id} no encontrado.`);
    }
    return group;
  }

  /**
   * Actualiza datos permitidos del grupo atendido.
   * No permite cambiar organizationId ni estado.
   * Revalida catálogos si cambian.
   */
  async update(
    id: string,
    updateDto: UpdateAttendedGroupDto,
  ): Promise<AttendedGroup> {
    const group = await this.attendedGroupsRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException(`Grupo atendido con id ${id} no encontrado.`);
    }

    // Revalidar catálogos si cambian
    if (updateDto.grupoEtarioId) {
      group.grupoEtario = await this.validateCatalog(
        updateDto.grupoEtarioId,
        'grupo_etario',
        'grupoEtarioId',
      );
    }
    if (updateDto.vulnerabilidadId) {
      group.vulnerabilidad = await this.validateCatalog(
        updateDto.vulnerabilidadId,
        'vulnerabilidad',
        'vulnerabilidadId',
      );
    }

    // Asignar campos escalares permitidos
    if (updateDto.nombre !== undefined) group.nombre = updateDto.nombre;
    if (updateDto.numeroPersonas !== undefined) group.numeroPersonas = updateDto.numeroPersonas;
    if (updateDto.observaciones !== undefined) group.observaciones = updateDto.observaciones;

    return this.attendedGroupsRepository.save(group);
  }

  /**
   * Desactiva un grupo atendido cambiando su estado a Inactivo.
   * No elimina físicamente el registro.
   */
  async deactivate(id: string): Promise<AttendedGroup> {
    const group = await this.attendedGroupsRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException(`Grupo atendido con id ${id} no encontrado.`);
    }

    if (group.estado === 'Inactivo') {
      throw new ConflictException('El grupo atendido ya se encuentra inactivo.');
    }

    group.estado = 'Inactivo';
    return this.attendedGroupsRepository.save(group);
  }
}
