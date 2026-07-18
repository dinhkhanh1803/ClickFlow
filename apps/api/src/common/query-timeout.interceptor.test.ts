import { RequestTimeoutException, type CallHandler, type ExecutionContext } from '@nestjs/common';
import { firstValueFrom, timer } from 'rxjs';

import { QueryTimeoutInterceptor } from './query-timeout.interceptor';

describe('QueryTimeoutInterceptor', () => {
  it('stops a request that exceeds the configured budget', async () => {
    vi.useFakeTimers();
    vi.stubEnv('QUERY_TIMEOUT_MS', '100');
    const interceptor = new QueryTimeoutInterceptor();
    const promise = firstValueFrom(interceptor.intercept(
      {} as ExecutionContext,
      { handle: () => timer(200) } as CallHandler
    ));
    const assertion = expect(promise).rejects.toBeInstanceOf(RequestTimeoutException);
    await vi.advanceTimersByTimeAsync(101);
    await assertion;
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });
});
