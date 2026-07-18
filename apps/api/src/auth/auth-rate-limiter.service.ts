import { TooManyRequestsException } from './too-many-requests.exception';

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class AuthRateLimiterService {
  private readonly entries = new Map<string, RateLimitEntry>();

  constructor(private readonly options: RateLimitOptions = { limit: 5, windowMs: 15 * 60_000 }) {}

  consume(action: string, ipAddress: string, identity: string, now = new Date()): void {
    const key = `${action}:${ipAddress}:${identity.trim().toLowerCase()}`;
    const timestamp = now.getTime();
    const current = this.entries.get(key);
    if (!current || current.resetAt <= timestamp) {
      this.entries.set(key, { count: 1, resetAt: timestamp + this.options.windowMs });
      return;
    }
    if (current.count >= this.options.limit) throw new TooManyRequestsException();
    current.count += 1;
  }

  reset(action: string, ipAddress: string, identity: string): void {
    this.entries.delete(`${action}:${ipAddress}:${identity.trim().toLowerCase()}`);
  }
}
