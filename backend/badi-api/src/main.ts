import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Orígenes CORS: separados por coma en CORS_ORIGIN, o localhost por defecto
  const rawOrigins = process.env.CORS_ORIGIN || 'http://localhost:4200';
  const allowedOrigins = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);
  const corsOrigin = allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins;

  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
// Trigger re-seed
bootstrap();

