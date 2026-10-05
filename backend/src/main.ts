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
  httpServer.use((req: any, res: any, next: () => void) => {
    const rawCookie = req.headers.cookie || '';
    req.cookies = Object.fromEntries(rawCookie.split(';').map((part: string) => part.trim()).filter(Boolean).map((part: string) => {
      const separator = part.indexOf('=');
      try { return [decodeURIComponent(part.slice(0, separator)), decodeURIComponent(part.slice(separator + 1))]; } catch { return ['', '']; }
    }));
    next();
  });
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", ...configuredOrigins],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        ...(config.NODE_ENV === 'production' ? { upgradeInsecureRequests: [] } : {}),
      },
    },
    referrerPolicy: { policy: 'no-referrer' },
  }));
  app.use(json({ limit: '100kb' }));
  app.use(urlencoded({ extended: false, limit: '100kb' }));

  app.enableCors({
    origin: (origin, callback) => callback(null, !origin || configuredOrigins.includes(origin)),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
    exposedHeaders: ['X-Request-Id'],
  });

  httpServer.use((req: any, res: any, next: () => void) => {
    const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
    const origin = req.headers.origin;
    if (!safeMethod) {
      const hasSessionCookie = Boolean(req.cookies?.sam_session);
      const originIsInvalid = Boolean(origin) && !configuredOrigins.includes(origin);
      const sessionMutationHasNoOrigin = hasSessionCookie && !origin;
      if (originIsInvalid || sessionMutationHasNoOrigin) {
        return res.status(403).json({ statusCode: 403, message: 'Origem da solicitação não permitida.' });
      }
    }
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    next();
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
