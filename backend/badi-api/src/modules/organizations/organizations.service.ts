import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Not, Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { OrganizationType } from '../organization-types/entities/organization-type.entity';
import { Catalog } from '../catalogs/entities/catalog.entity';
import { Representative } from '../representatives/entities/representative.entity';
import { AttendedGroup } from '../attended-groups/entities/attended-group.entity';
import { Leader } from '../leaders/entities/leader.entity';
import { AttendedGroupVulnerability } from '../attended-groups/entities/attended-group-vulnerability.entity';
import { Agreement } from '../agreements/entities/agreement.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { ReplaceRepresentativeDto } from './dto/replace-representative.dto';
import { CreateAttendedGroupWithLeaderDto } from './dto/create-group-with-leader.dto';
import { LocationsService } from '../locations/locations.service';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgsRepository: Repository<Organization>,

    @InjectRepository(OrganizationType)
    private readonly orgTypesRepository: Repository<OrganizationType>,

    @InjectRepository(Catalog)
    private readonly catalogsRepository: Repository<Catalog>,

    @InjectRepository(Representative)
    private readonly repsRepository: Repository<Representative>,

    @InjectRepository(AttendedGroup)
    private readonly groupsRepository: Repository<AttendedGroup>,

    @InjectRepository(Leader)
    private readonly leadersRepository: Repository<Leader>,

    private readonly dataSource: DataSource,

    private readonly locationsService: LocationsService,
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

    // Validar y asignar Provincia y Ciudad normalizada
    if (createDto.provinceId) {
      const provincia = await this.locationsService.validateProvince(createDto.provinceId);
      organization.provincia = provincia;

      if (createDto.cityId) {
        const ciudadCatalogo = await this.locationsService.validateCity(
          createDto.cityId,
          createDto.provinceId,
        );
        organization.ciudadCatalogo = ciudadCatalogo;
        // Auto-poblar campo legacy ciudad con el nombre normalizado
        organization.ciudad = ciudadCatalogo.nombre;
      }
    } else if (createDto.ciudad) {
      // Compatibilidad: si no se envía provinceId pero sí ciudad texto
      organization.ciudad = createDto.ciudad;
    }

    return this.orgsRepository.save(organization);
  }

  /**
   * Lista organizaciones con estado Registrada o Activa.
   */
  async findAll(includeInactive: boolean = false): Promise<Organization[]> {
    if (includeInactive) {
      return this.orgsRepository.find();
    }
    return this.orgsRepository.find({
      where: { estado: Not('Inactiva') },
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
   * Obtiene el detalle completo de una organización (datos generales, catálogos,
   * representantes, grupos atendidos, dirigentes y placeholder para documentos).
   */
  async getFullDetail(id: string): Promise<any> {
    const org = await this.orgsRepository.findOne({
      where: { id },
      relations: {
        tipoOrganizacion: true,
        accionSocial: true,
        segmento: true,
        frecuenciaRetiro: true,
        transporte: true,
      },
    });

    if (!org) {
      throw new NotFoundException(`Organización con id ${id} no encontrada.`);
    }

    if (org.estado === 'Inactiva') {
      throw new ConflictException('La organización está inactiva.');
    }

    const representantesRaw = await this.repsRepository.find({
      where: { organizacion: { id }, estado: 'Activo' },
    });

    const representantes = representantesRaw.map((rep) => ({
      id: rep.id,
      nombres: rep.nombres,
      apellidos: rep.apellidos,
      cedula: rep.cedula,
      telefono: rep.telefono,
      email: rep.email,
      cargo: rep.cargo,
      esPrincipal: rep.esPrincipal,
      estado: rep.estado,
      fechaRegistro: rep.fechaRegistro,
      fechaActualizacion: rep.fechaActualizacion,
    }));

    const gruposAtendidosRaw = await this.groupsRepository.find({
      where: { organizacion: { id }, estado: 'Activo' },
    });

    const gruposAtendidos = await Promise.all(
      gruposAtendidosRaw.map(async (grupo) => {
        const dirigentesRaw = await this.leadersRepository.find({
          where: { grupoAtendido: { id: grupo.id }, estado: 'Activo' },
        });

        const vulnerabilidadesRaw = await this.dataSource.getRepository(AttendedGroupVulnerability).find({
          where: { grupoAtendido: { id: grupo.id }, estado: 'Activo' },
          relations: { vulnerabilidad: true }
        });
        const vulnerabilidades = vulnerabilidadesRaw.map(v => v.vulnerabilidad);

        const dirigentes = dirigentesRaw.map((dir) => ({
          id: dir.id,
          representanteId: dir.representante ? dir.representante.id : null,
          nombres: dir.nombres,
          apellidos: dir.apellidos,
          cedula: dir.cedula,
          telefono: dir.telefono,
          email: dir.email,
          estado: dir.estado,
          fechaRegistro: dir.fechaRegistro,
          fechaActualizacion: dir.fechaActualizacion,
        }));

        return {
          grupo: {
            id: grupo.id,
            nombre: grupo.nombre,
            grupoEtario: grupo.grupoEtario,
            vulnerabilidad: grupo.vulnerabilidad,
            vulnerabilidades: vulnerabilidades,
            numeroPersonas: grupo.numeroPersonas,
            observaciones: grupo.observaciones,
            estado: grupo.estado,
            fechaRegistro: grupo.fechaRegistro,
            fechaActualizacion: grupo.fechaActualizacion,
          },
          dirigentes,
        };
      }),
    );

    const conveniosRaw = await this.dataSource.getRepository(Agreement).find({
      where: { organizacion: { id } },
      order: { fechaCreacion: 'DESC' },
      relations: { tipoConvenio: true }
    });

    const convenios = conveniosRaw.map(c => ({
      id: c.id,
      codigoConvenio: c.codigoConvenio,
      tipoConvenio: c.tipoConvenio,
      estado: c.estado,
      fechaInicio: c.fechaInicio,
      fechaActivacion: c.fechaActivacion,
      fechaFinEstimada: c.fechaFinEstimada,
      fechaFinalizacion: c.fechaFinalizacion,
      retirosRealizados: c.retirosRealizados,
      fechaCreacion: c.fechaCreacion,
      observaciones: c.observaciones,
      convenioOrigenId: c.convenioOrigenId,
      motivoCambio: c.motivoCambio,
    }));

    return {
      organizacion: {
        id: org.id,
        ruc: org.ruc,
        razonSocial: org.razonSocial,
        nombreComercial: org.nombreComercial,
        email: org.email,
        ciudad: org.ciudad,
        provincia: org.provincia || null,
        ciudadCatalogo: org.ciudadCatalogo || null,
        sectorBarrio: org.sectorBarrio,
        direccion: org.direccion,
        referenciaDireccion: org.referenciaDireccion,
        cuotaRecuperacionEstimada: org.cuotaRecuperacionEstimada,
        totalPersonasAtendidas: org.totalPersonasAtendidas,
        redesSociales: org.redesSociales,
        observaciones: org.observaciones,
        estado: org.estado,
        fechaRegistro: org.fechaRegistro,
        fechaActualizacion: org.fechaActualizacion,
        tipoOrganizacion: org.tipoOrganizacion,
        accionSocial: org.accionSocial,
        segmento: org.segmento,
        frecuenciaRetiro: org.frecuenciaRetiro,
        transporte: org.transporte,
      },
      representantes,
      gruposAtendidos,
      convenios,
      documentos: [],
    };
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
    if (updateDto.sectorBarrio !== undefined) org.sectorBarrio = updateDto.sectorBarrio;
    if (updateDto.direccion !== undefined) org.direccion = updateDto.direccion;
    if (updateDto.referenciaDireccion !== undefined) org.referenciaDireccion = updateDto.referenciaDireccion;
    if (updateDto.cuotaRecuperacionEstimada !== undefined) org.cuotaRecuperacionEstimada = updateDto.cuotaRecuperacionEstimada;
    if (updateDto.totalPersonasAtendidas !== undefined) org.totalPersonasAtendidas = updateDto.totalPersonasAtendidas;
    if (updateDto.redesSociales !== undefined) org.redesSociales = updateDto.redesSociales;
    if (updateDto.observaciones !== undefined) org.observaciones = updateDto.observaciones;

    // Actualizar Provincia y Ciudad normalizada si se envían
    if (updateDto.provinceId) {
      const provincia = await this.locationsService.validateProvince(updateDto.provinceId);
      org.provincia = provincia;

      if (updateDto.cityId) {
        const ciudadCatalogo = await this.locationsService.validateCity(
          updateDto.cityId,
          updateDto.provinceId,
        );
        org.ciudadCatalogo = ciudadCatalogo;
        // Auto-poblar campo legacy ciudad
        org.ciudad = ciudadCatalogo.nombre;
      }
    } else if (updateDto.ciudad !== undefined) {
      // Compatibilidad con actualización directa del campo texto
      org.ciudad = updateDto.ciudad;
    }

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

  /**
   * Reactiva una organización (Soft-Undelete).
   * Lanza error si no existe o si no está inactiva.
   */
  async activate(id: string): Promise<Organization> {
    const org = await this.orgsRepository.findOne({ where: { id } });
    if (!org) {
      throw new NotFoundException(`Organización con ID ${id} no encontrada.`);
    }

    if (org.estado !== 'Inactiva') {
      throw new ConflictException(
        `La organización ya se encuentra activa o registrada (Estado actual: ${org.estado}).`,
      );
    }

    org.estado = 'Registrada';
    return this.orgsRepository.save(org);
  }

  /**
   * Reemplaza el representante activo de una organización (transaccional).
   */
  async replaceRepresentative(orgId: string, dto: ReplaceRepresentativeDto): Promise<Representative> {
    const org = await this.orgsRepository.findOne({
      where: { id: orgId }
    });

    if (!org) {
      throw new NotFoundException(`Organización con ID ${orgId} no encontrada.`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Desactivar el representante principal activo si existe
      const activeReps = await queryRunner.manager.find(Representative, {
        where: { organizacion: { id: orgId }, estado: 'Activo', esPrincipal: true },
      });

      for (const activeRep of activeReps) {
        activeRep.estado = 'Inactivo';
        activeRep.esPrincipal = false;
        await queryRunner.manager.save(Representative, activeRep);
      }

      // 2. Crear el nuevo representante activo
      const newRep = new Representative();
      newRep.organizacion = org;
      newRep.nombres = dto.nombres;
      newRep.apellidos = dto.apellidos;
      newRep.cedula = dto.cedula;
      if (dto.telefono) newRep.telefono = dto.telefono;
      if (dto.email) newRep.email = dto.email;
      // newRep.cargo is left unassigned (or undefined) which TypeORM handles nicely
      newRep.esPrincipal = true;
      newRep.estado = 'Activo';

      const savedRep = await queryRunner.manager.save(Representative, newRep);

      await queryRunner.commitTransaction();
      return savedRep;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Crea un grupo atendido y su dirigente inicial en una sola transacción.
   */
  async createAttendedGroupWithLeader(
    orgId: string,
    dto: CreateAttendedGroupWithLeaderDto,
  ): Promise<any> {
    const org = await this.orgsRepository.findOne({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundException(`Organización con ID ${orgId} no encontrada.`);
    }

    if (org.estado === 'Inactiva') {
      throw new ConflictException('No se puede crear un grupo en una organización inactiva.');
    }

    const grupoEtario = await this.dataSource.getRepository(Catalog).findOne({
      where: { id: dto.grupoEtarioId },
    });
    if (!grupoEtario) {
      throw new NotFoundException('Catálogo de grupo etario no encontrado.');
    }

    const uniqueVulnerabilidadIds = [...new Set(dto.vulnerabilidadIds)];
    const vulnerabilidades: Catalog[] = [];
    for (const vulnId of uniqueVulnerabilidadIds) {
      const vuln = await this.dataSource.getRepository(Catalog).findOne({
        where: { id: vulnId, estado: 'Activo', tipoCatalogo: 'vulnerabilidad' },
      });
      if (!vuln) {
        throw new NotFoundException(`Catálogo de vulnerabilidad con id ${vulnId} no encontrado o inactivo.`);
      }
      vulnerabilidades.push(vuln);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Crear el grupo atendido
      const newGroup = new AttendedGroup();
      newGroup.organizacion = org;
      newGroup.nombre = dto.nombre;
      newGroup.grupoEtario = grupoEtario;
      newGroup.vulnerabilidad = vulnerabilidades[0];
      newGroup.numeroPersonas = dto.numeroPersonas;
      if (dto.observaciones) newGroup.observaciones = dto.observaciones;
      newGroup.estado = 'Activo';

      const savedGroup = await queryRunner.manager.save(AttendedGroup, newGroup);

      for (const vuln of vulnerabilidades) {
        const agv = new AttendedGroupVulnerability();
        agv.grupoAtendido = savedGroup;
        agv.vulnerabilidad = vuln;
        agv.estado = 'Activo';
        await queryRunner.manager.save(AttendedGroupVulnerability, agv);
      }

      // 2. Crear el dirigente
      const newLeader = new Leader();
      newLeader.grupoAtendido = savedGroup;
      newLeader.estado = 'Activo';

      if (dto.useActiveRepresentative) {
        // Buscar el representante activo principal
        const activeRep = await queryRunner.manager.findOne(Representative, {
          where: { organizacion: { id: orgId }, estado: 'Activo', esPrincipal: true },
        });

        if (!activeRep) {
          throw new ConflictException(
            'No se encontró un representante activo principal para asociarlo como dirigente.',
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

      return {
        grupo: savedGroup,
        dirigente: savedLeader,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
