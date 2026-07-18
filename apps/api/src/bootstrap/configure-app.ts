import { ValidationPipe, VersioningType, type INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import { json, urlencoded } from 'express';

import { AccessTokenGuard } from '../auth/access-token.guard';
import { WorkspaceMembershipGuard } from '../authorization/workspace-membership.guard';
import { apiRateLimitMiddleware } from '../common/api-rate-limit.middleware';
import { HttpExceptionFilter } from '../common/http-exception.filter';
import { IdempotencyKeyGuard } from '../common/idempotency-key';
import { QueryTimeoutInterceptor } from '../common/query-timeout.interceptor';
import { requestIdMiddleware } from '../common/request-id.middleware';
import { RequestLoggingInterceptor } from '../observability/request-logging.interceptor';
import { StructuredLoggerService } from '../observability/structured-logger.service';

export function configureApp(app: INestApplication, configuration: { corsOrigins: string[] }): void {
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useLogger(app.get(StructuredLoggerService));
  app.use(json({ limit: '1mb' }), urlencoded({ extended: false, limit: '1mb' }), requestIdMiddleware, apiRateLimitMiddleware(), helmet());
  app.enableCors({ origin: configuration.corsOrigins, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalGuards(app.get(AccessTokenGuard), app.get(IdempotencyKeyGuard), app.get(WorkspaceMembershipGuard));
  app.useGlobalInterceptors(app.get(QueryTimeoutInterceptor), app.get(RequestLoggingInterceptor));
  app.useGlobalFilters(app.get(HttpExceptionFilter));
  app.enableShutdownHooks();
}
