import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { StructuredLoggerService } from '../observability/structured-logger.service';

@Injectable()
export class AuthAuditService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(StructuredLoggerService) private readonly logger: StructuredLoggerService
  ) {}

  async recordForUser(userId: string, eventType: string, requestId?: string, metadata: Record<string, string> = {}): Promise<void> {
    const membership = await this.prisma.workspaceMember.findFirst({ where: { userId }, select: { workspaceId: true } });
    if (!membership) return;
    await this.prisma.activityLog.create({
      data: {
        workspaceId: membership.workspaceId,
        actorId: userId,
        eventType,
        subjectType: 'USER',
        subjectId: userId,
        requestId,
        metadata
      }
    });
  }

  recordUnknownIdentity(eventType: string, identity: string, requestId?: string): void {
    this.logger.warn({
      event: eventType,
      identityHash: createHash('sha256').update(identity.trim().toLowerCase()).digest('hex'),
      requestId
    }, AuthAuditService.name);
  }
}
