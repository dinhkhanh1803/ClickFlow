import { ValidationPipe, VersioningType, type INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import { HttpExceptionFilter } from '../common/http-exception.filter';
import { requestIdMiddleware } from '../common/request-id.middleware';

export function configureApp(app: INestApplication, configuration: { corsOrigins: string[] }): void {
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.use(requestIdMiddleware, helmet());
  app.enableCors({ origin: configuration.corsOrigins, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();
}
