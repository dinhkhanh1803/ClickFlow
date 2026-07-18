import { randomUUID } from 'node:crypto';
import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import * as argon2 from 'argon2';

import type { AuthenticatedUser } from '../authorization/authenticated-user';
import { PrismaService } from '../database/prisma.service';
import { AuthAuditService } from './auth-audit.service';
import type { ForgotPasswordInput, LoginInput, RegisterInput, ResetPasswordInput } from './auth.schemas';
import { MailAdapter } from './mail.adapter';
import { validatePasswordPolicy } from './password-policy';
import { decideRefreshRotation, validateResetTokenState } from './session-lifecycle';
import { TokenService } from './token.service';

export interface AuthClientContext {
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  timezone: string;
  locale: string;
}

export interface AuthResult {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  csrfToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
  user: PublicUser;
}

const publicUserSelect = {
  id: true,
  email: true,
  displayName: true,
  avatarUrl: true,
  timezone: true,
  locale: true
} as const;

function isUniqueFailure(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'P2002');
}

@Injectable()
export class AuthService {
  private readonly accessTtlSeconds = Number(process.env.JWT_ACCESS_EXPIRES_IN_SECONDS ?? 900);
  private readonly refreshTtlSeconds = Number(process.env.JWT_REFRESH_EXPIRES_IN_SECONDS ?? 7 * 24 * 60 * 60);
  private readonly resetTtlSeconds = Number(process.env.PASSWORD_RESET_EXPIRES_IN_SECONDS ?? 30 * 60);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(TokenService) private readonly tokens: TokenService,
    @Inject(MailAdapter) private readonly mail: MailAdapter,
    @Inject(AuthAuditService) private readonly audit: AuthAuditService
  ) {}

  async register(input: RegisterInput, context: AuthClientContext): Promise<AuthResult> {
    validatePasswordPolicy(input.password);
    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    const refreshToken = this.tokens.issueOpaqueToken();
    const csrfToken = this.tokens.issueOpaqueToken();
    const now = new Date();
    const refreshExpiresAt = new Date(now.getTime() + this.refreshTtlSeconds * 1000);
    try {
      const user = await this.prisma.$transaction(async (transaction) => {
        const created = await transaction.user.create({
          data: { email: input.email, displayName: input.displayName, passwordHash },
          select: publicUserSelect
        });
        const workspace = await transaction.workspace.create({
          data: { name: `${input.displayName}'s Workspace`, createdById: created.id },
          select: { id: true }
        });
        await transaction.workspaceMember.create({
          data: { workspaceId: workspace.id, userId: created.id, role: WorkspaceRole.OWNER }
        });
        await transaction.session.create({
          data: {
            userId: created.id,
            refreshTokenHash: this.tokens.hashOpaqueToken(refreshToken),
            tokenFamilyId: randomUUID(),
            userAgent: context.userAgent,
            ipAddress: context.ipAddress,
            expiresAt: refreshExpiresAt
          }
        });
        await transaction.activityLog.create({
          data: {
            workspaceId: workspace.id,
            actorId: created.id,
            eventType: 'AUTH_REGISTERED',
            subjectType: 'USER',
            subjectId: created.id,
            requestId: context.requestId
          }
        });
        return created;
      });
      return this.buildResult(user, refreshToken, csrfToken, refreshExpiresAt, now);
    } catch (error) {
      if (isUniqueFailure(error)) throw new ConflictException('Account already exists');
      throw error;
    }
  }

  async login(input: LoginInput, context: AuthClientContext): Promise<AuthResult> {
    const user = await this.prisma.user.findFirst({
      where: { email: input.email, archivedAt: null },
      select: { ...publicUserSelect, passwordHash: true }
    });
    let valid = false;
    if (user?.passwordHash) {
      try {
        valid = await argon2.verify(user.passwordHash, input.password);
      } catch {
        valid = false;
      }
    } else {
      await argon2.hash(input.password, { type: argon2.argon2id });
    }
    if (!user || !valid) {
      if (user) await this.audit.recordForUser(user.id, 'AUTH_LOGIN_FAILED', context.requestId);
      else this.audit.recordUnknownIdentity('AUTH_LOGIN_FAILED', input.email, context.requestId);
      throw new UnauthorizedException('Invalid email or password');
    }

    const refreshToken = this.tokens.issueOpaqueToken();
    const csrfToken = this.tokens.issueOpaqueToken();
    const now = new Date();
    const refreshExpiresAt = new Date(now.getTime() + this.refreshTtlSeconds * 1000);
    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: this.tokens.hashOpaqueToken(refreshToken),
        tokenFamilyId: randomUUID(),
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
        expiresAt: refreshExpiresAt
      }
    });
    await this.audit.recordForUser(user.id, 'AUTH_LOGIN_SUCCEEDED', context.requestId);
    const publicUser: PublicUser = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      timezone: user.timezone,
      locale: user.locale
    };
    return this.buildResult(publicUser, refreshToken, csrfToken, refreshExpiresAt, now);
  }

  async refresh(refreshToken: string, context: AuthClientContext): Promise<AuthResult> {
    const tokenHash = this.tokens.hashOpaqueToken(refreshToken);
    const current = await this.prisma.session.findUnique({
      where: { refreshTokenHash: tokenHash },
      include: { user: { select: publicUserSelect } }
    });
    if (!current || current.user === null) throw new UnauthorizedException('Refresh token is invalid');
    const now = new Date();
    const decision = decideRefreshRotation(current, now);
    if (decision === 'REUSED') {
      await this.prisma.session.updateMany({ where: { tokenFamilyId: current.tokenFamilyId }, data: { revokedAt: now } });
      await this.audit.recordForUser(current.userId, 'AUTH_REFRESH_REUSE_DETECTED', context.requestId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }
    if (decision === 'EXPIRED') {
      await this.prisma.session.updateMany({ where: { id: current.id, revokedAt: null }, data: { revokedAt: now } });
      throw new UnauthorizedException('Refresh token has expired');
    }

    const nextRefreshToken = this.tokens.issueOpaqueToken();
    const csrfToken = this.tokens.issueOpaqueToken();
    const refreshExpiresAt = new Date(now.getTime() + this.refreshTtlSeconds * 1000);
    const rotation = await this.prisma.$transaction(async (transaction) => {
      const revoked = await transaction.session.updateMany({
        where: { id: current.id, revokedAt: null, expiresAt: { gt: now } },
        data: { revokedAt: now }
      });
      if (revoked.count !== 1) {
        await transaction.session.updateMany({ where: { tokenFamilyId: current.tokenFamilyId }, data: { revokedAt: now } });
        return false;
      }
      await transaction.session.create({
        data: {
          userId: current.userId,
          refreshTokenHash: this.tokens.hashOpaqueToken(nextRefreshToken),
          tokenFamilyId: current.tokenFamilyId,
          userAgent: context.userAgent,
          ipAddress: context.ipAddress,
          expiresAt: refreshExpiresAt
        }
      });
      return true;
    });
    if (!rotation) {
      await this.audit.recordForUser(current.userId, 'AUTH_REFRESH_REUSE_DETECTED', context.requestId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }
    return this.buildResult(current.user, nextRefreshToken, csrfToken, refreshExpiresAt, now);
  }

  async logout(refreshToken: string | undefined, context: AuthClientContext): Promise<void> {
    if (!refreshToken) return;
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: this.tokens.hashOpaqueToken(refreshToken) },
      select: { id: true, userId: true }
    });
    if (!session) return;
    await this.prisma.session.updateMany({ where: { id: session.id, revokedAt: null }, data: { revokedAt: new Date() } });
    await this.audit.recordForUser(session.userId, 'AUTH_LOGOUT', context.requestId);
  }

  async forgotPassword(input: ForgotPasswordInput, context: AuthClientContext): Promise<void> {
    const user = await this.prisma.user.findFirst({ where: { email: input.email, archivedAt: null }, select: { id: true, email: true } });
    if (!user) {
      this.audit.recordUnknownIdentity('AUTH_PASSWORD_RESET_REQUESTED', input.email, context.requestId);
      return;
    }
    const rawToken = this.tokens.issueOpaqueToken();
    const expiresAt = new Date(Date.now() + this.resetTtlSeconds * 1000);
    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: this.tokens.hashOpaqueToken(rawToken), expiresAt }
    });
    const webUrl = process.env.WEB_URL ?? 'http://localhost:3000';
    await this.mail.sendPasswordReset({
      to: user.email,
      resetUrl: `${webUrl}/reset-password?token=${encodeURIComponent(rawToken)}`,
      expiresAt
    });
    await this.audit.recordForUser(user.id, 'AUTH_PASSWORD_RESET_REQUESTED', context.requestId);
  }

  async resetPassword(input: ResetPasswordInput, context: AuthClientContext): Promise<void> {
    validatePasswordPolicy(input.password);
    const tokenHash = this.tokens.hashOpaqueToken(input.token);
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, usedAt: true, expiresAt: true }
    });
    const now = new Date();
    if (!resetToken || !validateResetTokenState(resetToken, now)) throw new UnauthorizedException('Reset token is invalid or expired');
    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    const changed = await this.prisma.$transaction(async (transaction) => {
      const consumed = await transaction.passwordResetToken.updateMany({
        where: { id: resetToken.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now }
      });
      if (consumed.count !== 1) return false;
      await transaction.user.update({ where: { id: resetToken.userId }, data: { passwordHash } });
      await transaction.session.updateMany({ where: { userId: resetToken.userId, revokedAt: null }, data: { revokedAt: now } });
      return true;
    });
    if (!changed) throw new UnauthorizedException('Reset token is invalid or expired');
    await this.audit.recordForUser(resetToken.userId, 'AUTH_PASSWORD_RESET_COMPLETED', context.requestId);
  }

  async getCurrentUser(user: AuthenticatedUser): Promise<PublicUser> {
    const current = await this.prisma.user.findFirst({ where: { id: user.id, archivedAt: null }, select: publicUserSelect });
    if (!current) throw new UnauthorizedException('Account is unavailable');
    return current;
  }

  private buildResult(user: PublicUser, refreshToken: string, csrfToken: string, refreshExpiresAt: Date, now: Date): AuthResult {
    return {
      accessToken: this.tokens.issueAccessToken(user, now),
      tokenType: 'Bearer',
      expiresIn: this.accessTtlSeconds,
      csrfToken,
      refreshToken,
      refreshExpiresAt,
      user
    };
  }
}
