import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '../users/entities/user.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { BrevoMailService } from './services/brevo-mail.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'fallback-secret',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '8h',
        } as any,
      }),
    }),
    TypeOrmModule.forFeature([User, PasswordResetToken, AuditLog]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, BrevoMailService],
  exports: [AuthService, JwtModule, BrevoMailService],
})
export class AuthModule {}

