import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Leader } from './entities/leader.entity';
import { AttendedGroup } from '../attended-groups/entities/attended-group.entity';
import { Representative } from '../representatives/entities/representative.entity';
import { CreateLeaderDto } from './dto/create-leader.dto';
import { UpdateLeaderDto } from './dto/update-leader.dto';

@Injectable()
export class LeadersService {
  constructor(
    @InjectRepository(Leader)
    private readonly leadersRepository: Repository<Leader>,

    @InjectRepository(AttendedGroup)
    private readonly groupsRepository: Repository<AttendedGroup>,

    @InjectRepository(Representative)
    private readonly repsRepository: Repository<Representative>,
  ) {}

  /**
   * Crea un nuevo dirigente.
   * Valida grupo atendido. Si hay representante, valida organización coincidente y copia datos.
   */
  async create(createDto: CreateLeaderDto): Promise<Leader> {
    // Validar existencia de grupo atendido
    const group = await this.groupsRepository.findOne({
      where: { id: createDto.groupId },
      relations: { organizacion: true }, // Necesario para validar match con la organización del representante
    });
    if (!group) {
      throw new NotFoundException(`Grupo atendido con id ${createDto.groupId} no encontrado.`);
    }
    if (group.estado === 'Inactivo') {
      throw new ConflictException('No se puede crear un dirigente para un grupo atendido inactivo.');
    }

    const leader = new Leader();
    leader.grupoAtendido = group;
    leader.estado = 'Activo';

    if (createDto.representativeId) {
      // Validar representante
      const rep = await this.repsRepository.findOne({
        where: { id: createDto.representativeId },
        relations: { organizacion: true }, // Necesario para validar match
      });
      if (!rep) {
        throw new NotFoundException(`Representante con id ${createDto.representativeId} no encontrado.`);
      }
      if (rep.estado === 'Inactivo') {
        throw new ConflictException('El representante asociado no se encuentra activo.');
      }
      if (rep.organizacion.id !== group.organizacion.id) {
        throw new BadRequestException('El representante debe pertenecer a la misma organización que el grupo atendido.');
      }

      // Copiar datos del representante
      leader.representante = rep;
      leader.nombres = rep.nombres;
      leader.apellidos = rep.apellidos;
      leader.cedula = rep.cedula;
      leader.telefono = rep.telefono;
      leader.email = rep.email;
    } else {
      // Datos manuales (nombres y apellidos están garantizados por el DTO si no hay representativeId)
      leader.nombres = createDto.nombres!;
      leader.apellidos = createDto.apellidos!;
      if (createDto.cedula !== undefined) leader.cedula = createDto.cedula;
      if (createDto.telefono !== undefined) leader.telefono = createDto.telefono;
      if (createDto.email !== undefined) leader.email = createDto.email;
    }

    return this.leadersRepository.save(leader);
  }

  /**
   * Lista todos los dirigentes activos.
   */
  async findAll(): Promise<Leader[]> {
    return this.leadersRepository.find({
      where: { estado: 'Activo' },
    });
  }

  /**
   * Lista dirigentes activos de un grupo atendido específico.
   */
  async findByGroup(groupId: string): Promise<Leader[]> {
    const group = await this.groupsRepository.findOne({
      where: { id: groupId },
    });
    if (!group) {
      throw new NotFoundException(`Grupo atendido con id ${groupId} no encontrado.`);
    }

    return this.leadersRepository.find({
      where: {
        grupoAtendido: { id: groupId },
        estado: 'Activo',
      },
    });
  }

  /**
   * Busca un dirigente por UUID.
   */
  async findOne(id: string): Promise<Leader> {
    const leader = await this.leadersRepository.findOne({ where: { id } });
    if (!leader) {
      throw new NotFoundException(`Dirigente con id ${id} no encontrado.`);
    }
    return leader;
  }

  /**
   * Actualiza datos permitidos del dirigente.
   * No permite cambiar grupo ni representante vinculados.
   */
  async update(id: string, updateDto: UpdateLeaderDto): Promise<Leader> {
    const leader = await this.leadersRepository.findOne({ where: { id } });
    if (!leader) {
      throw new NotFoundException(`Dirigente con id ${id} no encontrado.`);
    }

    if (updateDto.nombres !== undefined) leader.nombres = updateDto.nombres;
    if (updateDto.apellidos !== undefined) leader.apellidos = updateDto.apellidos;
    if (updateDto.cedula !== undefined) leader.cedula = updateDto.cedula;
    if (updateDto.telefono !== undefined) leader.telefono = updateDto.telefono;
    if (updateDto.email !== undefined) leader.email = updateDto.email;

    return this.leadersRepository.save(leader);
  }

  /**
   * Desactiva un dirigente cambiando su estado a Inactivo.
   */
  async deactivate(id: string): Promise<Leader> {
    const leader = await this.leadersRepository.findOne({ where: { id } });
    if (!leader) {
      throw new NotFoundException(`Dirigente con id ${id} no encontrado.`);
    }

    if (leader.estado === 'Inactivo') {
      throw new ConflictException('El dirigente ya se encuentra inactivo.');
    }

    leader.estado = 'Inactivo';
    return this.leadersRepository.save(leader);
  }
}
