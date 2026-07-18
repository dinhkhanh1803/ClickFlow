import { Global, Module } from '@nestjs/common';

import { HttpExceptionFilter } from '../common/http-exception.filter';
import { IdempotencyKeyGuard } from '../common/idempotency-key';
import { QueryTimeoutInterceptor } from '../common/query-timeout.interceptor';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { RequestLoggingInterceptor } from './request-logging.interceptor';
import { StructuredLoggerService } from './structured-logger.service';

@Global()
@Module({
  controllers: [MetricsController],
  providers: [
    StructuredLoggerService,
    MetricsService,
    RequestLoggingInterceptor,
    QueryTimeoutInterceptor,
    IdempotencyKeyGuard,
    HttpExceptionFilter
  ],
  exports: [
    StructuredLoggerService,
    MetricsService,
    RequestLoggingInterceptor,
    QueryTimeoutInterceptor,
    IdempotencyKeyGuard,
    HttpExceptionFilter
  ]
})
export class ObservabilityModule {}
