import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';

interface TokenOptions {
  accessSecret?: string;
  accessTtlSeconds?: number;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
  jti: string;
}

const ephemeralDevelopmentSecret = randomBytes(32).toString('base64url');

function encodeJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function parsePayload(encoded: string): AccessTokenPayload {
  try {
    const value: unknown = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!value || typeof value !== 'object') throw new Error('Invalid payload');
    const payload = value as Partial<AccessTokenPayload>;
    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string'
      || typeof payload.iat !== 'number' || typeof payload.exp !== 'number' || typeof payload.jti !== 'string') {
      throw new Error('Invalid payload');
    }
    return payload as AccessTokenPayload;
  } catch {
    throw new UnauthorizedException('Access token is invalid');
  }
}

export class TokenService {
  private readonly accessSecret: string;
  private readonly accessTtlSeconds: number;

  constructor(options: TokenOptions = {}) {
    this.accessSecret = options.accessSecret ?? process.env.JWT_ACCESS_SECRET ?? ephemeralDevelopmentSecret;
    this.accessTtlSeconds = options.accessTtlSeconds ?? Number(process.env.JWT_ACCESS_EXPIRES_IN_SECONDS ?? 900);
  }

  issueAccessToken(user: { id: string; email: string }, now = new Date()): string {
    const issuedAt = Math.floor(now.getTime() / 1000);
    const header = encodeJson({ alg: 'HS256', typ: 'JWT' });
    const payload = encodeJson({
      sub: user.id,
      email: user.email,
      iat: issuedAt,
      exp: issuedAt + this.accessTtlSeconds,
      jti: randomUUID()
    });
    const signature = this.sign(`${header}.${payload}`);
    return `${header}.${payload}.${signature}`;
  }

  verifyAccessToken(token: string, now = new Date()): AccessTokenPayload {
    const [header, payload, signature, extra] = token.split('.');
    if (!header || !payload || !signature || extra) throw new UnauthorizedException('Access token is invalid');
    const expected = this.sign(`${header}.${payload}`);
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
      throw new UnauthorizedException('Access token is invalid');
    }
    const parsed = parsePayload(payload);
    if (parsed.exp <= Math.floor(now.getTime() / 1000)) throw new UnauthorizedException('Access token has expired');
    return parsed;
  }

  issueOpaqueToken(): string {
    return randomBytes(48).toString('base64url');
  }

  hashOpaqueToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private sign(value: string): string {
    return createHmac('sha256', this.accessSecret).update(value).digest('base64url');
  }
}
