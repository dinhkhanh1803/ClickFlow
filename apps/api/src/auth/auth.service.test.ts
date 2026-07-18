import type { PrismaService } from '../database/prisma.service';
import type { AuthAuditService } from './auth-audit.service';
import { AuthService } from './auth.service';
import type { MailAdapter } from './mail.adapter';
import { TokenService } from './token.service';

describe('AuthService credential failure', () => {
  it('returns the same unauthorized error for an unknown identity and creates no session', async () => {
    const prisma = {
      user: { findFirst: vi.fn().mockResolvedValue(null) },
      session: { create: vi.fn() }
    };
    const audit = { recordUnknownIdentity: vi.fn(), recordForUser: vi.fn() };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      new TokenService({ accessSecret: 'a'.repeat(32) }),
      { sendPasswordReset: vi.fn() } as unknown as MailAdapter,
      audit as unknown as AuthAuditService
    );

    await expect(service.login(
      { email: 'missing@clickflow.test', password: 'Unknown-Pass-9!' },
      { ipAddress: '127.0.0.1', requestId: 'request-a' }
    )).rejects.toMatchObject({ message: 'Invalid email or password' });
    expect(prisma.session.create).not.toHaveBeenCalled();
    expect(audit.recordUnknownIdentity).toHaveBeenCalledOnce();
  });
});
