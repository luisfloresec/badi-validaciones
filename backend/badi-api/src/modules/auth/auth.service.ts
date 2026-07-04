import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { BrevoMailService } from './services/brevo-mail.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly brevoMailService: BrevoMailService,
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

  /**
   * Solicita el envío de un enlace de recuperación de contraseña.
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const defaultResponse = { message: 'Si el correo está registrado, se enviará un enlace de recuperación.' };

    const user = await this.usersRepository.findOne({ where: { email: dto.email } });
    if (!user) {
      return defaultResponse;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const expiresInMinutes = Number(this.configService.get<string | number>('PASSWORD_RESET_TOKEN_EXPIRES_MINUTES')) || 15;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    const resetToken = this.passwordResetTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });
    await this.passwordResetTokenRepository.save(resetToken);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    await this.brevoMailService.sendPasswordResetEmail(user, resetLink);

    // Auditoría: Registrar solicitud de recuperación de contraseña
    const auditLog = this.auditRepository.create({
      userId: user.id,
      modulo: 'auth',
      entidad: 'User',
      entidadId: user.id,
      accion: 'FORGOT_PASSWORD',
      datosAnteriores: null,
      datosNuevos: { email: user.email },
      resultado: 'EXITO',
    });
    try {
      await this.auditRepository.save(auditLog);
    } catch (e) {
      console.error('Error guardando auditoría de forgot password', e);
    }

    return defaultResponse;
  }

  /**
   * Restablece la contraseña utilizando el token enviado por correo.
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden.');
    }

    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');

    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: { tokenHash },
      relations: { user: true },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      if (resetToken && resetToken.user) {
        const auditLog = this.auditRepository.create({
          userId: resetToken.user.id,
          modulo: 'auth',
          entidad: 'User',
          entidadId: resetToken.user.id,
          accion: 'RESET_PASSWORD',
          datosAnteriores: null,
          datosNuevos: null,
          resultado: 'ERROR: TOKEN_INVALIDO_O_EXPIRADO',
        });
        try {
          await this.auditRepository.save(auditLog);
        } catch (e) {
          console.error('Error guardando auditoría de reset password fallido', e);
        }
      }

      throw new BadRequestException('El enlace de recuperación no es válido o ha expirado.');
    }

    const user = resetToken.user;

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(dto.password, salt);
    if (user.requiereCambioPassword) {
      user.requiereCambioPassword = false;
    }
    await this.usersRepository.save(user);

    resetToken.usedAt = new Date();
    await this.passwordResetTokenRepository.save(resetToken);

    // Auditoría de restablecimiento exitoso
    const auditLog = this.auditRepository.create({
      userId: user.id,
      modulo: 'auth',
      entidad: 'User',
      entidadId: user.id,
      accion: 'RESET_PASSWORD',
      datosAnteriores: null,
      datosNuevos: { email: user.email },
      resultado: 'EXITO',
    });
    try {
      await this.auditRepository.save(auditLog);
    } catch (e) {
      console.error('Error guardando auditoría de reset password exitoso', e);
    }

    return { message: 'Contraseña restablecida correctamente.' };
  }
}

