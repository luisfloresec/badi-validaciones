import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { OrganizationType } from '../organization-types/entities/organization-type.entity';
import { Catalog } from '../catalogs/entities/catalog.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgsRepository: Repository<Organization>,

    @InjectRepository(OrganizationType)
    private readonly orgTypesRepository: Repository<OrganizationType>,

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
   * Crea una nueva organización con estado Registrada.
   * Valida RUC único, tipo de organización y catálogos referenciados.
   */
  async create(createDto: CreateOrganizationDto): Promise<Organization> {
    // Validar RUC único
    const existsByRuc = await this.orgsRepository.findOne({
      where: { ruc: createDto.ruc },
    });
    if (existsByRuc) {
      throw new ConflictException('Ya existe una organización con este RUC.');
    }

    // Validar tipo de organización
    const tipoOrg = await this.orgTypesRepository.findOne({
      where: { id: createDto.tipoOrganizacionId },
    });
    if (!tipoOrg) {
      throw new NotFoundException(
        `Tipo de organización con id ${createDto.tipoOrganizacionId} no encontrado.`,
      );
    }
    if (tipoOrg.estado !== 'Activo') {
      throw new ConflictException('El tipo de organización no está activo.');
    }

    // Validar catálogos obligatorios
    const accionSocial = await this.validateCatalog(
      createDto.accionSocialId,
      'accion_social',
      'accionSocialId',
    );
    const segmento = await this.validateCatalog(
      createDto.segmentoId,
      'segmento',
      'segmentoId',
    );

    // Validar catálogos opcionales
    let frecuenciaRetiro: Catalog | undefined;
    if (createDto.frecuenciaRetiroId) {
      frecuenciaRetiro = await this.validateCatalog(
        createDto.frecuenciaRetiroId,
        'frecuencia_retiro',
        'frecuenciaRetiroId',
      );
    }

    let transporte: Catalog | undefined;
    if (createDto.transporteId) {
      transporte = await this.validateCatalog(
        createDto.transporteId,
        'transporte',
        'transporteId',
      );
    }

    // Construir la entidad
    const organization = new Organization();
    organization.tipoOrganizacion = tipoOrg;
    organization.ruc = createDto.ruc;
    organization.razonSocial = createDto.razonSocial;
    organization.ciudad = createDto.ciudad;
    organization.direccion = createDto.direccion;
    organization.accionSocial = accionSocial;
    organization.segmento = segmento;
    organization.totalPersonasAtendidas = createDto.totalPersonasAtendidas;
    organization.estado = 'Registrada';

    // Campos opcionales
    if (createDto.nombreComercial !== undefined) organization.nombreComercial = createDto.nombreComercial;
    if (createDto.email !== undefined) organization.email = createDto.email;
    if (createDto.sectorBarrio !== undefined) organization.sectorBarrio = createDto.sectorBarrio;
    if (createDto.referenciaDireccion !== undefined) organization.referenciaDireccion = createDto.referenciaDireccion;
    if (frecuenciaRetiro) organization.frecuenciaRetiro = frecuenciaRetiro;
    if (createDto.cuotaRecuperacionEstimada !== undefined) organization.cuotaRecuperacionEstimada = createDto.cuotaRecuperacionEstimada;
    if (transporte) organization.transporte = transporte;
    if (createDto.redesSociales !== undefined) organization.redesSociales = createDto.redesSociales;
    if (createDto.observaciones !== undefined) organization.observaciones = createDto.observaciones;

    return this.orgsRepository.save(organization);
  }

  /**
   * Lista organizaciones con estado Registrada o Activa.
   */
  async findAll(): Promise<Organization[]> {
    return this.orgsRepository.find({
      where: { estado: In(['Registrada', 'Activa']) },
    });
  }

  /**
   * Busca una organización por su RUC.
   * Lanza NotFoundException si no existe.
   */
  async findByRuc(ruc: string): Promise<Organization> {
    const org = await this.orgsRepository.findOne({ where: { ruc } });
    if (!org) {
      throw new NotFoundException(`Organización con RUC ${ruc} no encontrada.`);
    }
    return org;
  }

  /**
   * Busca una organización por su UUID.
   * Lanza NotFoundException si no existe.
   */
  async findOne(id: string): Promise<Organization> {
    const org = await this.orgsRepository.findOne({ where: { id } });
    if (!org) {
      throw new NotFoundException(`Organización con id ${id} no encontrada.`);
    }
    return org;
  }

  /**
   * Actualiza datos permitidos de una organización.
   * Revalida FKs si cambian. No permite modificar estado.
   */
  async update(
    id: string,
    updateDto: UpdateOrganizationDto,
  ): Promise<Organization> {
    const org = await this.orgsRepository.findOne({ where: { id } });
    if (!org) {
      throw new NotFoundException(`Organización con id ${id} no encontrada.`);
    }

    // Validar RUC único si cambia
    if (updateDto.ruc && updateDto.ruc !== org.ruc) {
      const existsByRuc = await this.orgsRepository.findOne({
        where: { ruc: updateDto.ruc },
      });
      if (existsByRuc) {
        throw new ConflictException('Ya existe una organización con este RUC.');
      }
    }

    // Revalidar tipo de organización si cambia
    if (updateDto.tipoOrganizacionId) {
      const tipoOrg = await this.orgTypesRepository.findOne({
        where: { id: updateDto.tipoOrganizacionId },
      });
      if (!tipoOrg) {
        throw new NotFoundException(
          `Tipo de organización con id ${updateDto.tipoOrganizacionId} no encontrado.`,
        );
      }
      if (tipoOrg.estado !== 'Activo') {
        throw new ConflictException('El tipo de organización no está activo.');
      }
      org.tipoOrganizacion = tipoOrg;
    }

    // Revalidar catálogos si cambian
    if (updateDto.accionSocialId) {
      org.accionSocial = await this.validateCatalog(
        updateDto.accionSocialId,
        'accion_social',
        'accionSocialId',
      );
    }
    if (updateDto.segmentoId) {
      org.segmento = await this.validateCatalog(
        updateDto.segmentoId,
        'segmento',
        'segmentoId',
      );
    }
    if (updateDto.frecuenciaRetiroId) {
      org.frecuenciaRetiro = await this.validateCatalog(
        updateDto.frecuenciaRetiroId,
        'frecuencia_retiro',
        'frecuenciaRetiroId',
      );
    }
    if (updateDto.transporteId) {
      org.transporte = await this.validateCatalog(
        updateDto.transporteId,
        'transporte',
        'transporteId',
      );
    }

    // Asignar campos escalares permitidos
    if (updateDto.ruc !== undefined) org.ruc = updateDto.ruc;
    if (updateDto.razonSocial !== undefined) org.razonSocial = updateDto.razonSocial;
    if (updateDto.nombreComercial !== undefined) org.nombreComercial = updateDto.nombreComercial;
    if (updateDto.email !== undefined) org.email = updateDto.email;
    if (updateDto.ciudad !== undefined) org.ciudad = updateDto.ciudad;
    if (updateDto.sectorBarrio !== undefined) org.sectorBarrio = updateDto.sectorBarrio;
    if (updateDto.direccion !== undefined) org.direccion = updateDto.direccion;
    if (updateDto.referenciaDireccion !== undefined) org.referenciaDireccion = updateDto.referenciaDireccion;
    if (updateDto.cuotaRecuperacionEstimada !== undefined) org.cuotaRecuperacionEstimada = updateDto.cuotaRecuperacionEstimada;
    if (updateDto.totalPersonasAtendidas !== undefined) org.totalPersonasAtendidas = updateDto.totalPersonasAtendidas;
    if (updateDto.redesSociales !== undefined) org.redesSociales = updateDto.redesSociales;
    if (updateDto.observaciones !== undefined) org.observaciones = updateDto.observaciones;

    return this.orgsRepository.save(org);
  }

  /**
   * Desactiva una organización cambiando su estado a Inactiva.
   * No elimina físicamente el registro.
   */
  async deactivate(id: string): Promise<Organization> {
    const org = await this.orgsRepository.findOne({ where: { id } });
    if (!org) {
      throw new NotFoundException(`Organización con id ${id} no encontrada.`);
    }

    if (org.estado === 'Inactiva') {
      throw new ConflictException('La organización ya se encuentra inactiva.');
    }

    org.estado = 'Inactiva';
    return this.orgsRepository.save(org);
  }
}
