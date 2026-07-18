import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Inject } from '@nestjs/common';
import type { Response } from 'express';

import { StructuredLoggerService } from '../observability/structured-logger.service';

export interface MappedException {
  status: number;
  code: string;
  message: string;
  details: unknown;
}

const HTTP_CODES: Record<number, string> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  408: 'REQUEST_TIMEOUT',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  429: 'RATE_LIMITED',
  503: 'SERVICE_UNAVAILABLE'
};

function prismaCode(exception: unknown): string | undefined {
  if (!exception || typeof exception !== 'object' || !('code' in exception)) return undefined;
  return typeof exception.code === 'string' ? exception.code : undefined;
}

export function mapException(exception: unknown): MappedException {
  const databaseCode = prismaCode(exception);
  if (databaseCode === 'P2002' || databaseCode === 'P2003') {
    return { status: 409, code: 'CONFLICT', message: 'Resource already exists', details: undefined };
  }
  if (databaseCode === 'P2025') {
    return { status: 404, code: 'NOT_FOUND', message: 'Resource not found', details: undefined };
  }
  if (!(exception instanceof HttpException)) {
    return { status: 500, code: 'INTERNAL_ERROR', message: 'Internal server error', details: undefined };
  }

  const status = exception.getStatus();
  const raw = exception.getResponse();
  const rawMessage = raw && typeof raw === 'object' && 'message' in raw ? raw.message : raw;
  const details = status >= 500 ? undefined : Array.isArray(rawMessage) ? rawMessage : undefined;
  const message = status >= 500
    ? 'Internal server error'
    : Array.isArray(rawMessage)
      ? 'Validation failed'
      : typeof rawMessage === 'string'
        ? rawMessage
        : 'Request failed';
  return { status, code: HTTP_CODES[status] ?? (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'), message, details };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(@Inject(StructuredLoggerService) private readonly logger: StructuredLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const mapped = mapException(exception);
    const requestId = String(response.locals.requestId ?? 'unknown');
    if (mapped.status >= 500) {
      this.logger.error({ event: 'unhandled_exception', requestId, exception }, undefined, HttpExceptionFilter.name);
    }
    response.status(mapped.status).json({
      code: mapped.code,
      message: mapped.message,
      details: mapped.details,
      requestId
    });
  }
}
