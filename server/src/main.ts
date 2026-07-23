import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = process.env.ORIGINS
    ? process.env.ORIGINS.split(',').map((origin) => origin.trim())
    : [];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(new ValidationPipe());

  // Vercel serverless requires await app.init() alongside or instead of listen depending on setup,
  // but if you are using standard @vercel/node build output, ensure it listens or exports correctly:
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
