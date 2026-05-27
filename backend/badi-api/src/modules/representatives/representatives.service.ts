import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Representative } from './entities/representative.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { CreateRepresentativeDto } from './dto/create-representative.dto';
import { UpdateRepresentativeDto } from './dto/update-representative.dto';

@Injectable()
export class RepresentativesService {
  constructor(
    @InjectRepository(Representative)
    private readonly repsRepository: Repository<Representative>,

    @InjectRepository(Organization)
    private readonly orgsRepository: Repository<Organization>,
  ) {}

  /**
   * Valida que no exista otro representante principal activo en la organización.
   * Si excludeId se proporciona, excluye a ese representante de la búsqueda.
   */
  private async validateUniquePrincipal(
    organizationId: string,
    excludeId?: string,
  ): Promise<void> {
    const where: any = {
      organizacion: { id: organizationId },
      esPrincipal: true,
      estado: 'Activo',
    };
    if (excludeId) {
      where.id = Not(excludeId);
    }

    const existing = await this.repsRepository.findOne({ where });
    if (existing) {
      throw new ConflictException(
        'Ya existe un representante principal activo en esta organización.',
      );
    }
  }

  /**
   * Crea un nuevo representante con estado Activo.
   * Valida que la organización exista y no esté Inactiva.
   * Si esPrincipal = true, valida que no exista otro principal activo.
   */
  async create(createDto: CreateRepresentativeDto): Promise<Representative> {
    // Validar que la organización exista
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
        'No se puede crear un representante para una organización inactiva.',
      );
    }

    // Validar representante principal único
    if (createDto.esPrincipal) {
      await this.validateUniquePrincipal(createDto.organizationId);
    }

    // Construir la entidad
    const rep = new Representative();
    rep.organizacion = org;
    rep.nombres = createDto.nombres;
    rep.apellidos = createDto.apellidos;
    rep.esPrincipal = createDto.esPrincipal;
    rep.estado = 'Activo';

    // Campos opcionales
    if (createDto.cedula !== undefined) rep.cedula = createDto.cedula;
    if (createDto.telefono !== undefined) rep.telefono = createDto.telefono;
    if (createDto.email !== undefined) rep.email = createDto.email;
    if (createDto.cargo !== undefined) rep.cargo = createDto.cargo;

    return this.repsRepository.save(rep);
  }

  /**
   * Lista todos los representantes con estado Activo.
   */
  async findAll(): Promise<Representative[]> {
    return this.repsRepository.find({
      where: { estado: 'Activo' },
    });
  }

  /**
   * Lista representantes activos de una organización específica.
   * Valida que la organización exista.
   */
  async findByOrganization(organizationId: string): Promise<Representative[]> {
    const org = await this.orgsRepository.findOne({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException(
        `Organización con id ${organizationId} no encontrada.`,
      );
    }

    return this.repsRepository.find({
      where: {
        organizacion: { id: organizationId },
        estado: 'Activo',
      },
    });
  }

  /**
   * Busca un representante por su UUID.
   * Lanza NotFoundException si no existe.
   */
  async findOne(id: string): Promise<Representative> {
    const rep = await this.repsRepository.findOne({ where: { id } });
    if (!rep) {
      throw new NotFoundException(`Representante con id ${id} no encontrado.`);
    }
    return rep;
  }

  /**
   * Actualiza datos permitidos del representante.
   * No permite cambiar organizationId ni estado.
   * Si esPrincipal cambia a true, valida que no exista otro principal activo
   * en la misma organización, excluyendo al representante actual.
   */
  async update(
    id: string,
    updateDto: UpdateRepresentativeDto,
  ): Promise<Representative> {
    const rep = await this.repsRepository.findOne({ where: { id } });
    if (!rep) {
      throw new NotFoundException(`Representante con id ${id} no encontrado.`);
    }

    // Si esPrincipal cambia a true, validar unicidad
    if (updateDto.esPrincipal === true && !rep.esPrincipal) {
      await this.validateUniquePrincipal(rep.organizacion.id, id);
    }

    // Asignar campos permitidos
    if (updateDto.nombres !== undefined) rep.nombres = updateDto.nombres;
    if (updateDto.apellidos !== undefined) rep.apellidos = updateDto.apellidos;
    if (updateDto.cedula !== undefined) rep.cedula = updateDto.cedula;
    if (updateDto.telefono !== undefined) rep.telefono = updateDto.telefono;
    if (updateDto.email !== undefined) rep.email = updateDto.email;
    if (updateDto.cargo !== undefined) rep.cargo = updateDto.cargo;
    if (updateDto.esPrincipal !== undefined) rep.esPrincipal = updateDto.esPrincipal;

    return this.repsRepository.save(rep);
  }

  /**
   * Desactiva un representante cambiando su estado a Inactivo.
   * Si es principal, queda inactivo sin reasignar automáticamente.
   * No elimina físicamente el registro.
   */
  async deactivate(id: string): Promise<Representative> {
    const rep = await this.repsRepository.findOne({ where: { id } });
    if (!rep) {
      throw new NotFoundException(`Representante con id ${id} no encontrado.`);
    }

    if (rep.estado === 'Inactivo') {
      throw new ConflictException('El representante ya se encuentra inactivo.');
    }

    rep.estado = 'Inactivo';
    return this.repsRepository.save(rep);
  }
}
