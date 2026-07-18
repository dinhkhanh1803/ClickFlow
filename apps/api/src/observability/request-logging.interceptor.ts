import { CallHandler, ExecutionContext, Inject, Injectable, type NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs';

import { MetricsService } from './metrics.service';
import { StructuredLoggerService } from './structured-logger.service';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(MetricsService) private readonly metrics: MetricsService,
    @Inject(StructuredLoggerService) private readonly logger: StructuredLoggerService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = performance.now();
    const locals = response.locals as Record<string, unknown>;
    const requestId = typeof locals.requestId === 'string' ? locals.requestId : 'unknown';
    this.metrics.beginRequest();

    const finish = (statusCode: number): void => {
      const durationMs = Math.max(0, performance.now() - startedAt);
      this.metrics.recordRequest(statusCode, durationMs);
      this.logger.log({
        event: 'http_request',
        requestId,
        method: request.method,
        path: request.originalUrl,
        statusCode,
        durationMs: Math.round(durationMs * 100) / 100
      }, RequestLoggingInterceptor.name);
    };

    return next.handle().pipe(tap({
      next: () => finish(response.statusCode),
      error: () => finish(response.statusCode >= 400 ? response.statusCode : 500)
    }));
  }
}
