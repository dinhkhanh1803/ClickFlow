import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../database/prisma.service';
import type { AuthAuditService } from './auth-audit.service';
import { AuthService } from './auth.service';
import type { MailAdapter } from './mail.adapter';
import { TokenService } from './token.service';

describe('email verification lifecycle', () => {
  it('consumes the token once and marks the user verified', async () => {
    const token = 'verification-token-that-is-long-enough-for-the-schema-123';
    const tokenService = new TokenService({ accessSecret: 'a'.repeat(32) });
    const updateUser = vi.fn<(input: { data: { emailVerifiedAt: Date } }) => Promise<object>>().mockResolvedValue({});
    const transaction = {
      emailVerificationToken: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      user: { update: updateUser }
    };
    const prisma = {
      emailVerificationToken: { findUnique: vi.fn().mockResolvedValue({ id: 'verification-1', userId: 'user-1', usedAt: null, expiresAt: new Date(Date.now() + 60_000) }) },
      $transaction: vi.fn((callback: (client: typeof transaction) => unknown) => Promise.resolve(callback(transaction)))
    };
    const audit = { recordForUser: vi.fn() };
    const service = new AuthService(prisma as unknown as PrismaService, tokenService, { sendPasswordReset: vi.fn(), sendEmailVerification: vi.fn() } as unknown as MailAdapter, audit as unknown as AuthAuditService);

    await service.verifyEmail({ token }, { requestId: 'request-1' });

    expect(transaction.emailVerificationToken.updateMany).toHaveBeenCalledOnce();
    expect(transaction.user.update).toHaveBeenCalledOnce();
    const updateCall: unknown = transaction.user.update.mock.calls[0]?.[0];
    expect(updateCall && typeof updateCall === 'object' && 'data' in updateCall && updateCall.data && typeof updateCall.data === 'object' && 'emailVerifiedAt' in updateCall.data && updateCall.data.emailVerifiedAt instanceof Date).toBe(true);
    expect(audit.recordForUser).toHaveBeenCalledWith('user-1', 'AUTH_EMAIL_VERIFIED', 'request-1');
  });
});
