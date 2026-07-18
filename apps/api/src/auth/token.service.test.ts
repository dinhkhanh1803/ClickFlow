import { UnauthorizedException } from '@nestjs/common';

import { TokenService } from './token.service';

describe('TokenService', () => {
  const service = new TokenService({ accessSecret: 'a'.repeat(32), accessTtlSeconds: 60 });

  it('issues and verifies a signed access token', () => {
    const token = service.issueAccessToken({ id: 'user-a', email: 'owner@clickflow.test' }, new Date('2026-01-01T00:00:00Z'));
    expect(service.verifyAccessToken(token, new Date('2026-01-01T00:00:30Z'))).toMatchObject({
      sub: 'user-a',
      email: 'owner@clickflow.test'
    });
  });

  it('rejects expired and tampered access tokens', () => {
    const token = service.issueAccessToken({ id: 'user-a', email: 'owner@clickflow.test' }, new Date('2026-01-01T00:00:00Z'));
    expect(() => service.verifyAccessToken(token, new Date('2026-01-01T00:01:01Z'))).toThrow(UnauthorizedException);
    expect(() => service.verifyAccessToken(`${token.slice(0, -1)}x`, new Date('2026-01-01T00:00:30Z'))).toThrow(UnauthorizedException);
  });

  it('creates opaque refresh tokens and deterministic hashes', () => {
    const token = service.issueOpaqueToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(service.hashOpaqueToken(token)).toBe(service.hashOpaqueToken(token));
    expect(service.hashOpaqueToken(token)).not.toContain(token);
  });
});
