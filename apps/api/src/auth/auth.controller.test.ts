import { ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';

import { AuthController } from './auth.controller';
import type { AuthRateLimiterService } from './auth-rate-limiter.service';
import type { AuthService } from './auth.service';
import type { CsrfService } from './csrf.service';
import type { GoogleIdentityVerifier } from './google-identity.verifier';
import type { TokenService } from './token.service';

function createController(auth: Partial<AuthService> = {}) {
  const limiter = { consume: vi.fn(), reset: vi.fn() };
  return {
    limiter,
    controller: new AuthController(
      auth as AuthService,
      limiter as unknown as AuthRateLimiterService,
      {} as unknown as CsrfService,
      { hashOpaqueToken: vi.fn((value: string) => 'hash:' + value) } as unknown as TokenService,
      { verify: vi.fn() } as unknown as GoogleIdentityVerifier
    )
  };
}

describe('AuthController registration', () => {
  afterEach(() => {
    delete process.env.PUBLIC_REGISTRATION_ENABLED;
    delete process.env.GOOGLE_LOGIN_ENABLED;
  });

  it('blocks public registration by default for seeded-account deployments', async () => {
    const registerEmail = vi.fn();
    const { controller } = createController({ registerEmail });

    await expect(controller.register(
      { email: 'person@clickflow.test', displayName: 'Person Test', password: 'Person-Pass-10!' },
      { header: vi.fn().mockReturnValue('vitest') } as unknown as Request,
      '127.0.0.1'
    )).rejects.toThrow(ForbiddenException);
    expect(registerEmail).not.toHaveBeenCalled();
  });

  it('routes legacy register through email verification without issuing a session when explicitly enabled', async () => {
    process.env.PUBLIC_REGISTRATION_ENABLED = 'true';
    const register = vi.fn();
    const registerEmail = vi.fn().mockResolvedValue({ accepted: true, email: 'person@clickflow.test' });
    const { controller } = createController({ register, registerEmail } as Partial<AuthService>);

    const result = await controller.register(
      { email: 'person@clickflow.test', displayName: 'Person Test', password: 'Person-Pass-10!' },
      { header: vi.fn().mockReturnValue('vitest') } as unknown as Request,
      '127.0.0.1'
    );

    expect(result).toEqual({ accepted: true, email: 'person@clickflow.test' });
    expect(registerEmail).toHaveBeenCalledOnce();
    expect(register).not.toHaveBeenCalled();
  });
});