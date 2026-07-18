import { Global, Module } from '@nestjs/common';

import { AccessTokenGuard } from './access-token.guard';
import { AuthAuditService } from './auth-audit.service';
import { AuthController } from './auth.controller';
import { AuthRateLimiterService } from './auth-rate-limiter.service';
import { AuthService } from './auth.service';
import { CsrfService } from './csrf.service';
import { FakeMailAdapter, MailAdapter } from './mail.adapter';
import { TokenService } from './token.service';
import { UsersController } from './users.controller';

@Global()
@Module({
  controllers: [AuthController, UsersController],
  providers: [
    AuthService,
    AuthAuditService,
    AccessTokenGuard,
    { provide: TokenService, useFactory: () => new TokenService() },
    {
      provide: AuthRateLimiterService,
      useFactory: () => new AuthRateLimiterService({
        limit: Number(process.env.AUTH_RATE_LIMIT ?? 5),
        windowMs: Number(process.env.AUTH_RATE_WINDOW_MS ?? 15 * 60_000)
      })
    },
    { provide: CsrfService, useFactory: () => new CsrfService() },
    { provide: MailAdapter, useClass: FakeMailAdapter }
  ],
  exports: [AuthService, AccessTokenGuard, TokenService, MailAdapter]
})
export class AuthModule {}
