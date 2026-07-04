import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class BrevoMailService {
  private readonly logger = new Logger(BrevoMailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendPasswordResetEmail(user: User, resetLink: string): Promise<boolean> {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    const mailFromName = this.configService.get<string>('MAIL_FROM_NAME') || 'BADI';
    const mailFromEmail = this.configService.get<string>('MAIL_FROM_EMAIL');
    const templateId = this.configService.get<number | string>('BREVO_RESET_PASSWORD_TEMPLATE_ID');
    const expirationMinutes = this.configService.get<number | string>('PASSWORD_RESET_TOKEN_EXPIRES_MINUTES') || 15;

    if (!apiKey || !mailFromEmail || !templateId) {
      this.logger.error('Brevo API no está completamente configurado en las variables de entorno.');
      return false;
    }

    const payload = {
      sender: {
        name: mailFromName,
        email: mailFromEmail,
      },
      to: [
        {
          email: user.email,
          name: user.nombres || user.email,
        },
      ],
      templateId: Number(templateId),
      params: {
        userName: user.nombres || 'usuario',
        resetLink: resetLink,
        expirationMinutes: Number(expirationMinutes),
      },
    };

    try {
      await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });
      this.logger.log(`Correo de recuperación enviado exitosamente a: ${user.email}`);
      return true;
    } catch (error) {
      this.logger.error(`Error enviando correo de recuperación a ${user.email}: ${error.message}`);
      return false;
    }
  }
}
