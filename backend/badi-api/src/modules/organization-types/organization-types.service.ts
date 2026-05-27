import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationType } from './entities/organization-type.entity';
import { CreateOrganizationTypeDto } from './dto/create-organization-type.dto';
import { UpdateOrganizationTypeDto } from './dto/update-organization-type.dto';

@Injectable()
export class OrganizationTypesService {
  constructor(
    @InjectRepository(OrganizationType)
    private readonly orgTypesRepository: Repository<OrganizationType>,
  ) {}

  /**
   * Crea un nuevo tipo de organización con estado Activo.
   * Valida que el nombre no esté duplicado.
   */
  async create(createDto: CreateOrganizationTypeDto): Promise<OrganizationType> {
    const exists = await this.orgTypesRepository.findOne({
      where: { nombre: createDto.nombre },
    });
    if (exists) {
      throw new ConflictException('Ya existe un tipo de organización con este nombre.');
    }

    const orgType = this.orgTypesRepository.create({
      ...createDto,
      estado: 'Activo',
    });

    return this.orgTypesRepository.save(orgType);
  }

  /**
   * Lista todos los tipos de organización con estado Activo.
   */
  async findAll(): Promise<OrganizationType[]> {
    return this.orgTypesRepository.find({
      where: { estado: 'Activo' },
    });
  }

  /**
   * Busca un tipo de organización por su UUID.
   * Lanza NotFoundException si no existe.
   */
  async findOne(id: string): Promise<OrganizationType> {
    const orgType = await this.orgTypesRepository.findOne({ where: { id } });
    if (!orgType) {
      throw new NotFoundException(`Tipo de organización con id ${id} no encontrado.`);
    }
    return orgType;
  }

  /**
   * Actualiza nombre y/o descripcion de un tipo de organización.
   * Valida unicidad del nombre si está cambiando.
   * No permite modificar el estado desde este método.
   */
  async update(
    id: string,
    updateDto: UpdateOrganizationTypeDto,
  ): Promise<OrganizationType> {
    const orgType = await this.orgTypesRepository.findOne({ where: { id } });
    if (!orgType) {
      throw new NotFoundException(`Tipo de organización con id ${id} no encontrado.`);
    }

    // Verificar nombre único si está cambiando
    if (updateDto.nombre && updateDto.nombre !== orgType.nombre) {
      const existsByName = await this.orgTypesRepository.findOne({
        where: { nombre: updateDto.nombre },
      });
      if (existsByName) {
        throw new ConflictException('Ya existe un tipo de organización con este nombre.');
      }
    }

    Object.assign(orgType, updateDto);
    return this.orgTypesRepository.save(orgType);
  }

  /**
   * Desactiva un tipo de organización cambiando su estado a Inactivo.
   * No elimina físicamente el registro.
   */
  async deactivate(id: string): Promise<OrganizationType> {
    const orgType = await this.orgTypesRepository.findOne({ where: { id } });
    if (!orgType) {
      throw new NotFoundException(`Tipo de organización con id ${id} no encontrado.`);
    }

    if (orgType.estado === 'Inactivo') {
      throw new ConflictException('El tipo de organización ya se encuentra inactivo.');
    }

    orgType.estado = 'Inactivo';
    return this.orgTypesRepository.save(orgType);
  }
}
