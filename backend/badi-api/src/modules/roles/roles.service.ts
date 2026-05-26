import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  /**
   * Crea un nuevo rol con estado Activo.
   * Valida que el nombre no esté duplicado.
   */
  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const exists = await this.rolesRepository.findOne({
      where: { nombre: createRoleDto.nombre },
    });
    if (exists) {
      throw new ConflictException('Ya existe un rol con este nombre.');
    }

    const role = this.rolesRepository.create({
      ...createRoleDto,
      estado: 'Activo',
    });

    return this.rolesRepository.save(role);
  }

  /**
   * Lista todos los roles con estado Activo.
   */
  async findAll(): Promise<Role[]> {
    return this.rolesRepository.find({
      where: { estado: 'Activo' },
    });
  }

  /**
   * Busca un rol por su UUID.
   * Lanza NotFoundException si no existe.
   */
  async findOne(id: string): Promise<Role> {
    const role = await this.rolesRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Rol con id ${id} no encontrado.`);
    }
    return role;
  }

  /**
   * Actualiza nombre y/o descripcion de un rol.
   * Valida unicidad del nombre si está cambiando.
   * No permite modificar el estado desde este método.
   */
  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.rolesRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Rol con id ${id} no encontrado.`);
    }

    // Verificar nombre único si está cambiando
    if (updateRoleDto.nombre && updateRoleDto.nombre !== role.nombre) {
      const existsByName = await this.rolesRepository.findOne({
        where: { nombre: updateRoleDto.nombre },
      });
      if (existsByName) {
        throw new ConflictException('Ya existe un rol con este nombre.');
      }
    }

    Object.assign(role, updateRoleDto);
    return this.rolesRepository.save(role);
  }

  /**
   * Desactiva un rol cambiando su estado a Inactivo.
   * No elimina físicamente el registro.
   */
  async deactivate(id: string): Promise<Role> {
    const role = await this.rolesRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Rol con id ${id} no encontrado.`);
    }

    if (role.estado === 'Inactivo') {
      throw new ConflictException('El rol ya se encuentra inactivo.');
    }

    role.estado = 'Inactivo';
    return this.rolesRepository.save(role);
  }
}
