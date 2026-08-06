import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { HttpErrorFilter } from './common/filters/http-error.filter';
import { validateEnv } from './config/env.validation';

async function bootstrap() {
  const config = validateEnv(process.env);
  const configuredOrigins = config.CORS_ORIGINS as string[];

  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const httpServer = app.getHttpAdapter().getInstance();
  httpServer.disable('x-powered-by');
  httpServer.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
  app.use(helmet());
  app.use(json({ limit: '100kb' }));
  app.use(urlencoded({ extended: false, limit: '100kb' }));

  app.enableCors({
    origin: (origin, callback) => callback(null, !origin || configuredOrigins.includes(origin)),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpErrorFilter());

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
}
bootstrap();
