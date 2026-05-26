import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from './entities/user-role.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { AssignRoleDto } from './dto/assign-role.dto';

@Injectable()
export class UserRolesService {
  constructor(
    @InjectRepository(UserRole)
    private readonly userRolesRepository: Repository<UserRole>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  /**
   * Asigna un rol a un usuario.
   * Valida que el usuario exista y esté Activo.
   * Valida que el rol exista y esté Activo.
   * No permite duplicar la misma asignación.
   */
  async assign(assignRoleDto: AssignRoleDto): Promise<UserRole> {
    const { userId, roleId } = assignRoleDto;

    // Validar que el usuario exista
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuario con id ${userId} no encontrado.`);
    }

    // Validar que el usuario esté activo
    if (user.estado !== 'Activo') {
      throw new ConflictException('No se puede asignar un rol a un usuario inactivo.');
    }

    // Validar que el rol exista
    const role = await this.rolesRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Rol con id ${roleId} no encontrado.`);
    }

    // Validar que el rol esté activo
    if (role.estado !== 'Activo') {
      throw new ConflictException('No se puede asignar un rol con estado inactivo.');
    }

    // Validar que no exista la misma asignación
    const exists = await this.userRolesRepository.findOne({
      where: {
        usuario: { id: userId },
        rol: { id: roleId },
      },
    });
    if (exists) {
      throw new ConflictException('El usuario ya tiene asignado este rol.');
    }

    const userRole = this.userRolesRepository.create({
      usuario: user,
      rol: role,
    });

    return this.userRolesRepository.save(userRole);
  }

  /**
   * Lista todas las asignaciones usuario-rol con sus relaciones.
   */
  async findAll(): Promise<UserRole[]> {
    return this.userRolesRepository.find({
      relations: { usuario: true, rol: true },
    });
  }

  /**
   * Lista los roles asignados a un usuario específico.
   * Valida que el usuario exista.
   */
  async findByUser(userId: string): Promise<UserRole[]> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuario con id ${userId} no encontrado.`);
    }

    return this.userRolesRepository.find({
      where: { usuario: { id: userId } },
      relations: { usuario: true, rol: true },
    });
  }

  /**
   * Elimina físicamente una asignación usuario-rol.
   * Solo elimina la relación, no el usuario ni el rol.
   */
  async remove(id: string): Promise<{ message: string }> {
    const userRole = await this.userRolesRepository.findOne({ where: { id } });
    if (!userRole) {
      throw new NotFoundException(`Asignación con id ${id} no encontrada.`);
    }

    await this.userRolesRepository.remove(userRole);
    return { message: `Asignación con id ${id} eliminada correctamente.` };
  }
}
