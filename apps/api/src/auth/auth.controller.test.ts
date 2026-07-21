import type { Request } from 'express';

import { AuthController } from './auth.controller';
import type { AuthRateLimiterService } from './auth-rate-limiter.service';
import type { AuthService } from './auth.service';
import type { CsrfService } from './csrf.service';
import type { GoogleIdentityVerifier } from './google-identity.verifier';
import type { TokenService } from './token.service';

describe('AuthController registration', () => {
  it('routes legacy register through email verification without issuing a session', async () => {
    const register = vi.fn();
    const registerEmail = vi.fn().mockResolvedValue({ accepted: true, email: 'person@clickflow.test' });
    const auth = { register, registerEmail };
    const limiter = { consume: vi.fn(), reset: vi.fn() };
    const controller = new AuthController(
      auth as unknown as AuthService,
      limiter as unknown as AuthRateLimiterService,
      {} as unknown as CsrfService,
      { hashOpaqueToken: vi.fn((value: string) => 'hash:' + value) } as unknown as TokenService,
      {} as unknown as GoogleIdentityVerifier
    );

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
