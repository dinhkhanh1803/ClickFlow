import type { NextFunction, Request, Response } from 'express';

export class FixedWindowRateLimiter {
  private readonly entries = new Map<string, { count: number; resetAt: number }>();
  constructor(private readonly limit = 300, private readonly windowMs = 60_000) {}
  consume(key: string, now = Date.now()): { allowed: boolean; retryAfterSeconds: number } {
    const current = this.entries.get(key);
    if (!current || current.resetAt <= now) { this.entries.set(key, { count: 1, resetAt: now + this.windowMs }); return { allowed: true, retryAfterSeconds: 0 }; }
    if (current.count >= this.limit) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
    current.count++; return { allowed: true, retryAfterSeconds: 0 };
  }
}

export function apiRateLimitMiddleware(limit = Number(process.env.API_RATE_LIMIT ?? 300), windowMs = Number(process.env.API_RATE_WINDOW_MS ?? 60_000)) {
  const limiter = new FixedWindowRateLimiter(limit, windowMs);
  return (request: Request, response: Response, next: NextFunction): void => {
    if (request.path.startsWith('/api/health')) return next();
    const result = limiter.consume(request.ip || request.socket.remoteAddress || 'unknown');
    if (result.allowed) return next();
    response.setHeader('Retry-After', String(result.retryAfterSeconds)); response.status(429).json({ code: 'RATE_LIMITED', message: 'Too many requests' });
  };
}
