import { describe, expect, it } from 'vitest';
import { FixedWindowRateLimiter } from './api-rate-limit.middleware';
describe('API rate limiter', () => { it('blocks above the fixed-window budget and resets', () => { const limiter = new FixedWindowRateLimiter(2, 1000); expect(limiter.consume('ip', 0).allowed).toBe(true); expect(limiter.consume('ip', 1).allowed).toBe(true); expect(limiter.consume('ip', 2)).toEqual({ allowed: false, retryAfterSeconds: 1 }); expect(limiter.consume('ip', 1000).allowed).toBe(true); }); });
