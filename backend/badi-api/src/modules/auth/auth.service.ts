import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Autentica un usuario por email y contraseña.
   * Retorna un access_token JWT.
   */
  async login(loginDto: LoginDto): Promise<{ access_token: string; user: Omit<JwtPayload, 'sub'> & { id: string, requiereCambioPassword?: boolean } }> {
    const { email, password } = loginDto;

    // Buscar usuario con roles
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: { usuarioRoles: { rol: true } },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    if (user.estado !== 'Activo') {
      throw new UnauthorizedException('La cuenta se encuentra deshabilitada. Contacte al administrador.');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    // Extraer nombres y perfiles de roles
    const roles = user.usuarioRoles
      .filter((ur) => ur.rol.estado === 'Activo')
      .map((ur) => ({ nombre: ur.rol.nombre, perfilAcceso: ur.rol.perfilAcceso }));

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      nombres: user.nombres,
      apellidos: user.apellidos,
      roles,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        nombres: user.nombres,
        apellidos: user.apellidos,
        requiereCambioPassword: user.requiereCambioPassword,
        roles,
      },
    };
  }

  /**
   * Devuelve los datos del usuario autenticado.
   */
  async getProfile(userId: string): Promise<{
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
    cedula: string | null;
    telefono: string | null;
    roles: { nombre: string; perfilAcceso: string }[];
    requiereCambioPassword?: boolean;
    estado: string;
  }> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: { usuarioRoles: { rol: true } },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    const roles = user.usuarioRoles
      .filter((ur) => ur.rol.estado === 'Activo')
      .map((ur) => ({ nombre: ur.rol.nombre, perfilAcceso: ur.rol.perfilAcceso }));

    return {
      id: user.id,
      nombres: user.nombres,
      apellidos: user.apellidos,
      email: user.email,
      cedula: user.cedula,
      telefono: user.telefono,
      requiereCambioPassword: user.requiereCambioPassword,
      estado: user.estado,
      roles,
    };
  }

  /**
   * Permite al usuario autenticado actualizar sus datos básicos.
   */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    if (dto.email && dto.email !== user.email) {
      const emailExists = await this.usersRepository.findOne({ where: { email: dto.email } });
      if (emailExists) {
        throw new BadRequestException('El correo electrónico ya está en uso.');
      }
    }

    Object.assign(user, dto);
    await this.usersRepository.save(user);

    return this.getProfile(user.id);
  }

  /**
   * Permite al usuario autenticado cambiar su propia contraseña.
   */
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    const currentValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!currentValid) {
      throw new BadRequestException('La contraseña actual no es correcta.');
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(dto.newPassword, salt);
    user.requiereCambioPassword = false;
    await this.usersRepository.save(user);

    return { message: 'Contraseña actualizada correctamente.' };
  }
}
