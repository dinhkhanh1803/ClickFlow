import { ForbiddenException, Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

export type WorkspaceAccessLevel = 'VIEW' | 'EDIT';

@Injectable()
export class WorkspaceMembershipService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async hasAccess(userId: string, workspaceId: string, level: WorkspaceAccessLevel = 'VIEW'): Promise<boolean> {
    const membership = await this.prisma.workspaceMember.findFirst({
      where: { userId, workspaceId, workspace: { archivedAt: null } },
      select: { id: true }
    });
    if (membership) return true;

    const workspace = await this.prisma.workspace.findFirst({
      where: level === 'EDIT'
        ? { id: workspaceId, archivedAt: null, private: false, publicAccess: 'EDIT' }
        : { id: workspaceId, archivedAt: null, private: false, publicAccess: { in: ['VIEW', 'EDIT'] } },
      select: { id: true }
    });
    return Boolean(workspace);
  }

  async assertAccess(userId: string, workspaceId: string, level: WorkspaceAccessLevel = 'VIEW'): Promise<void> {
    if (!await this.hasAccess(userId, workspaceId, level)) throw new ForbiddenException('Workspace access denied');
  }
}
