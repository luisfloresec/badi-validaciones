import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export type UserResponse = Omit<User, 'passwordHash' | 'usuarioRoles'> & { roles: { id: string; nombre: string; perfilAcceso: string }[] };

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRolesRepository: Repository<UserRole>,
  ) {}

  /**
   * Crea un nuevo usuario y le asigna roles si se envían en roleIds.
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponse> {
    const existsByEmail = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existsByEmail) {
      throw new ConflictException('Ya existe un usuario con este email.');
    }

    if (createUserDto.cedula) {
      const existsByCedula = await this.usersRepository.findOne({
        where: { cedula: createUserDto.cedula },
      });
      if (existsByCedula) {
        throw new ConflictException('Ya existe un usuario con esta cédula.');
      }
    }

    const { password, roleIds, ...userData } = createUserDto;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = this.usersRepository.create({
      ...userData,
      passwordHash,
    });
    const savedUser = await this.usersRepository.save(user);

    if (roleIds && roleIds.length > 0) {
      await this.assignRoles(savedUser, roleIds);
    }

    return this.findOne(savedUser.id);
  }

  /**
   * Lista todos los usuarios con estado Activo, incluyendo sus roles mapeados.
   */
  async findAll(): Promise<UserResponse[]> {
    const users = await this.usersRepository.find({
      where: { estado: 'Activo' },
      relations: { usuarioRoles: { rol: true } },
    });
    return users.map((user) => this.mapUserResponse(user));
  }

  /**
   * Busca un usuario por su UUID.
   */
  async findOne(id: string): Promise<UserResponse> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { usuarioRoles: { rol: true } },
    });
    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado.`);
    }
    return this.mapUserResponse(user);
  }

  /**
   * Actualiza campos de un usuario y sobrescribe sus roles si se envían roleIds.
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponse> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado.`);
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existsByEmail = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existsByEmail) {
        throw new ConflictException('Ya existe un usuario con este email.');
      }
    }

    if (updateUserDto.cedula && updateUserDto.cedula !== user.cedula) {
      const existsByCedula = await this.usersRepository.findOne({
        where: { cedula: updateUserDto.cedula },
      });
      if (existsByCedula) {
        throw new ConflictException('Ya existe un usuario con esta cédula.');
      }
    }

    const { password, roleIds, ...restDto } = updateUserDto;
    Object.assign(user, restDto);

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password, salt);
    }

    const savedUser = await this.usersRepository.save(user);

    if (roleIds !== undefined) {
      await this.assignRoles(savedUser, roleIds);
    }

    return this.findOne(savedUser.id);
  }

  /**
   * Desactiva un usuario. No se permite si es el último Administrador Activo.
   */
  async deactivate(id: string): Promise<UserResponse> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { usuarioRoles: { rol: true } },
    });
    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado.`);
    }

    if (user.estado === 'Inactivo') {
      throw new ConflictException('El usuario ya se encuentra inactivo.');
    }

    // Regla de seguridad: Si tiene rol de administrador, bloquear desactivación si no hay mas administradores
    const hasAdminRole = user.usuarioRoles.some((ur) => ur.rol.nombre === 'Administrador');
    if (hasAdminRole) {
      throw new ConflictException('Por seguridad, no se puede desactivar a un usuario Administrador desde esta vía.');
    }

    user.estado = 'Inactivo';
    const saved = await this.usersRepository.save(user);
    return this.mapUserResponse(saved);
  }

  /**
   * Asigna roles a un usuario borrando los anteriores.
   */
  private async assignRoles(user: User, roleIds: string[]) {
    // Borrar roles actuales
    await this.userRolesRepository.delete({ usuario: { id: user.id } });

    if (roleIds.length === 0) return;

    // Buscar nuevos roles
    const roles = await this.rolesRepository.find({
      where: { id: In(roleIds) },
    });

    if (roles.length !== roleIds.length) {
      throw new BadRequestException('Algunos de los roles proporcionados no existen.');
    }

    // Crear nuevas relaciones
    const userRolesToSave = roles.map((rol) => {
      return this.userRolesRepository.create({
        usuario: user,
        rol: rol,
      });
    });

    await this.userRolesRepository.save(userRolesToSave);
  }

  /**
   * Transforma el arreglo de usuarioRoles a un arreglo plano de roles, y excluye el hash de contraseña.
   */
  private mapUserResponse(user: User): UserResponse {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, usuarioRoles, ...result } = user;
    const rolesMap = (usuarioRoles || [])
      .filter((ur) => ur.rol)
      .map((ur) => ({ id: ur.rol.id, nombre: ur.rol.nombre, perfilAcceso: ur.rol.perfilAcceso }));

    return { ...result, roles: rolesMap };
  }
}
