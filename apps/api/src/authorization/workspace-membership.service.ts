import { ForbiddenException, Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

@Injectable()
export class WorkspaceMembershipService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async hasAccess(userId: string, workspaceId: string): Promise<boolean> {
    const membership = await this.prisma.workspaceMember.findFirst({
      where: { userId, workspaceId, workspace: { archivedAt: null } },
      select: { id: true }
    });
    return Boolean(membership);
  }

  async assertAccess(userId: string, workspaceId: string): Promise<void> {
    if (!await this.hasAccess(userId, workspaceId)) throw new ForbiddenException('Workspace access denied');
  }
}
