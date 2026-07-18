import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

function initials(displayName: string): string {
  return displayName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
}

@Injectable()
export class WorkspaceService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  listForUser(userId: string) {
    return this.prisma.workspaceMember.findMany({
      where: { userId, workspace: { archivedAt: null } },
      orderBy: [{ workspace: { updatedAt: 'desc' } }, { workspaceId: 'asc' }],
      select: {
        role: true,
        workspace: {
          select: { id: true, name: true, tone: true, private: true, timezone: true, locale: true, createdAt: true, updatedAt: true }
        }
      }
    }).then((memberships) => memberships.map(({ workspace, role }) => ({ ...workspace, role })));
  }

  async getById(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId, workspace: { archivedAt: null } },
      select: {
        role: true,
        workspace: {
          select: { id: true, name: true, tone: true, private: true, timezone: true, locale: true, createdAt: true, updatedAt: true }
        }
      }
    });
    if (!membership) throw new NotFoundException('Workspace not found');
    return { ...membership.workspace, role: membership.role };
  }

  async listMembers(workspaceId: string) {
    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId, workspace: { archivedAt: null }, user: { archivedAt: null } },
      orderBy: [{ role: 'asc' }, { user: { displayName: 'asc' } }, { userId: 'asc' }],
      select: {
        id: true,
        userId: true,
        role: true,
        user: { select: { displayName: true, avatarUrl: true } }
      }
    });
    return members.map(({ user, ...membership }) => ({
      ...membership,
      displayName: user.displayName,
      initials: initials(user.displayName),
      avatarUrl: user.avatarUrl
    }));
  }
}
