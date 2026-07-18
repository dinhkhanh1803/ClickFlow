import { TooManyRequestsException } from './too-many-requests.exception';
import { AuthRateLimiterService } from './auth-rate-limiter.service';

describe('AuthRateLimiterService', () => {
  it('limits repeated attempts by action, IP and normalized identity', () => {
    const limiter = new AuthRateLimiterService({ limit: 2, windowMs: 60_000 });
    const now = new Date('2026-01-01T00:00:00Z');
    limiter.consume('login', '127.0.0.1', 'Owner@ClickFlow.Test', now);
    limiter.consume('login', '127.0.0.1', 'owner@clickflow.test', now);
    expect(() => limiter.consume('login', '127.0.0.1', 'owner@clickflow.test', now)).toThrow(TooManyRequestsException);
  });

  it('starts a new window after expiry', () => {
    const limiter = new AuthRateLimiterService({ limit: 1, windowMs: 1_000 });
    limiter.consume('reset', '127.0.0.1', 'owner@clickflow.test', new Date('2026-01-01T00:00:00Z'));
    expect(() => limiter.consume('reset', '127.0.0.1', 'owner@clickflow.test', new Date('2026-01-01T00:00:02Z'))).not.toThrow();
  });
});
