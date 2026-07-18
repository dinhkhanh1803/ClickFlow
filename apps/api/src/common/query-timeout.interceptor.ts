import { CallHandler, ExecutionContext, Injectable, RequestTimeoutException, type NestInterceptor } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { catchError, throwError, TimeoutError, timeout } from 'rxjs';

@Injectable()
export class QueryTimeoutInterceptor implements NestInterceptor {
  private readonly timeoutMs = Number(process.env.QUERY_TIMEOUT_MS ?? 10_000);

  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      timeout({ each: this.timeoutMs }),
      catchError((error: unknown) => throwError(() => error instanceof TimeoutError
        ? new RequestTimeoutException('Request timed out')
        : error))
    );
  }
}
