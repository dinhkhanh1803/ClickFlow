import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = exception instanceof HttpException ? exception.getResponse() : undefined;
    const message = typeof raw === 'string' ? raw : raw && typeof raw === 'object' && 'message' in raw && typeof raw.message === 'string' ? raw.message : status === 500 ? 'Internal server error' : 'Request failed';
    response.status(status).json({
      code: status === 404 ? 'NOT_FOUND' : status === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
      message,
      details: raw && typeof raw === 'object' && 'message' in raw && Array.isArray(raw.message) ? raw.message : undefined,
      requestId: String(response.locals.requestId ?? 'unknown')
    });
  }
}
