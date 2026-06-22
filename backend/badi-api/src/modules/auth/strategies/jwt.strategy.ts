import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly cls: ClsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret',
    });
  }

  /**
   * Llamado automáticamente por Passport tras verificar la firma del JWT.
   * Valida que el usuario siga activo en la base de datos.
   * Lo que retorne se inyecta en request.user.
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || user.estado !== 'Activo') {
      throw new UnauthorizedException('Sesión inválida o cuenta deshabilitada.');
    }

    this.cls.set('userId', payload.sub);

    return payload;
  }
}
