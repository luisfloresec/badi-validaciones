import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AttendedGroup } from './entities/attended-group.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Catalog } from '../catalogs/entities/catalog.entity';
import { Leader } from '../leaders/entities/leader.entity';
import { Representative } from '../representatives/entities/representative.entity';
import { CreateAttendedGroupDto } from './dto/create-attended-group.dto';
import { UpdateAttendedGroupDto } from './dto/update-attended-group.dto';
import { ReplaceLeaderDto } from './dto/replace-leader.dto';

@Injectable()
export class AttendedGroupsService {
  constructor(
    @InjectRepository(AttendedGroup)
    private readonly attendedGroupsRepository: Repository<AttendedGroup>,

    @InjectRepository(Organization)
    private readonly orgsRepository: Repository<Organization>,

    @InjectRepository(Catalog)
    private readonly catalogsRepository: Repository<Catalog>,

    private readonly dataSource: DataSource,
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

  /**
   * Reemplaza o asigna el dirigente activo de un grupo atendido (transaccional).
   * Inactiva al dirigente actual y crea uno nuevo.
   */
  async replaceLeader(groupId: string, dto: ReplaceLeaderDto): Promise<Leader> {
    const group = await this.attendedGroupsRepository.findOne({
      where: { id: groupId },
      relations: { organizacion: true },
    });

    if (!group) {
      throw new NotFoundException(`Grupo atendido con ID ${groupId} no encontrado.`);
    }

    if (group.estado === 'Inactivo') {
      throw new ConflictException('No se puede asignar un dirigente a un grupo inactivo.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Inactivar el dirigente actual del grupo si existe
      const activeLeaders = await queryRunner.manager.find(Leader, {
        where: { grupoAtendido: { id: groupId }, estado: 'Activo' },
      });

      for (const leader of activeLeaders) {
        leader.estado = 'Inactivo';
        await queryRunner.manager.save(Leader, leader);
      }

      // 2. Crear el nuevo dirigente
      const newLeader = new Leader();
      newLeader.grupoAtendido = group;
      newLeader.estado = 'Activo';

      if (dto.useActiveRepresentative) {
        // Buscar el representante activo principal de la organización de este grupo
        const activeRep = await queryRunner.manager.findOne(Representative, {
          where: { organizacion: { id: group.organizacion.id }, estado: 'Activo', esPrincipal: true },
        });

        if (!activeRep) {
          throw new ConflictException(
            'No se encontró un representante activo principal en la organización para asociarlo como dirigente.',
          );
        }

        newLeader.representante = activeRep;
        newLeader.nombres = activeRep.nombres;
        newLeader.apellidos = activeRep.apellidos;
        newLeader.cedula = activeRep.cedula;
        newLeader.telefono = activeRep.telefono;
        newLeader.email = activeRep.email;
      } else {
        // Usar los datos manuales del DTO
        if (!dto.nombres || !dto.apellidos) {
          throw new BadRequestException('Nombres y apellidos son requeridos para un nuevo dirigente.');
        }

        newLeader.nombres = dto.nombres;
        newLeader.apellidos = dto.apellidos;
        if (dto.cedula) newLeader.cedula = dto.cedula;
        if (dto.telefono) newLeader.telefono = dto.telefono;
        if (dto.email) newLeader.email = dto.email;
      }

      const savedLeader = await queryRunner.manager.save(Leader, newLeader);

      await queryRunner.commitTransaction();
      return savedLeader;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
