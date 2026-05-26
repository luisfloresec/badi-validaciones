import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Crea un nuevo usuario.
   * Hashea la contraseña con bcrypt antes de guardar.
   * Valida unicidad de email y cédula.
   */
  async create(
    createUserDto: CreateUserDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    // Verificar email único
    const existsByEmail = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existsByEmail) {
      throw new ConflictException('Ya existe un usuario con este email.');
    }

    // Verificar cédula única si se proporciona
    if (createUserDto.cedula) {
      const existsByCedula = await this.usersRepository.findOne({
        where: { cedula: createUserDto.cedula },
      });
      if (existsByCedula) {
        throw new ConflictException('Ya existe un usuario con esta cédula.');
      }
    }

    // Separar password del resto y hashear
    const { password, ...userData } = createUserDto;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = this.usersRepository.create({
      ...userData,
      passwordHash,
    });

    const saved = await this.usersRepository.save(user);
    return this.excludePasswordHash(saved);
  }

  /**
   * Lista todos los usuarios con estado Activo.
   * Nunca devuelve passwordHash.
   */
  async findAll(): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await this.usersRepository.find({
      where: { estado: 'Activo' },
    });
    return users.map((user) => this.excludePasswordHash(user));
  }

  /**
   * Busca un usuario por su UUID.
   * Lanza NotFoundException si no existe.
   */
  async findOne(id: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado.`);
    }
    return this.excludePasswordHash(user);
  }

  /**
   * Actualiza campos permitidos de un usuario.
   * Si se envía password, se re-hashea.
   * No permite modificar estado (usar deactivate para eso).
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado.`);
    }

    // Verificar email único si está cambiando
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existsByEmail = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existsByEmail) {
        throw new ConflictException('Ya existe un usuario con este email.');
      }
    }

    // Verificar cédula única si está cambiando
    if (updateUserDto.cedula && updateUserDto.cedula !== user.cedula) {
      const existsByCedula = await this.usersRepository.findOne({
        where: { cedula: updateUserDto.cedula },
      });
      if (existsByCedula) {
        throw new ConflictException('Ya existe un usuario con esta cédula.');
      }
    }

    // Separar password del DTO para manejo especial
    const { password, ...restDto } = updateUserDto;
    Object.assign(user, restDto);

    // Si se envía password, re-hashear
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password, salt);
    }

    const saved = await this.usersRepository.save(user);
    return this.excludePasswordHash(saved);
  }

  /**
   * Desactiva un usuario cambiando su estado a Inactivo.
   * No elimina físicamente el registro.
   */
  async deactivate(id: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado.`);
    }

    if (user.estado === 'Inactivo') {
      throw new ConflictException('El usuario ya se encuentra inactivo.');
    }

    user.estado = 'Inactivo';
    const saved = await this.usersRepository.save(user);
    return this.excludePasswordHash(saved);
  }

  /**
   * Excluye passwordHash de la respuesta.
   * Garantiza que nunca se devuelve la contraseña en JSON.
   */
  private excludePasswordHash(user: User): Omit<User, 'passwordHash'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }
}
