import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';
import type { CreateWorkspaceInput, InviteWorkspaceMemberInput, UpdateWorkspaceInput } from './workspace.schemas';

function initials(displayName: string): string {
  return displayName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
}

function withoutMembers<T extends object>(workspace: T): Omit<T, 'members'> {
  const publicWorkspace = { ...workspace } as T & { members?: unknown };
  delete publicWorkspace.members;
  return publicWorkspace;
}
const workspaceSelect = {
  id: true,
  name: true,
  description: true,
  tone: true,
  private: true,
  publicAccess: true,
  timezone: true,
  locale: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, displayName: true, avatarUrl: true } }
} as const;

@Injectable()
export class WorkspaceService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(userId: string, input: CreateWorkspaceInput) {
    const workspace = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.workspace.create({
        data: {
          createdById: userId,
          name: input.name,
          description: input.description ?? null,
          tone: input.tone,
          private: input.private,
          publicAccess: input.publicAccess,
          timezone: input.timezone,
          locale: input.locale
        },
        select: workspaceSelect
      });
      await transaction.workspaceMember.create({
        data: { workspaceId: created.id, userId, role: WorkspaceRole.OWNER }
      });
      return created;
    });
    return { ...workspace, role: WorkspaceRole.OWNER };
  }

  async listForUser(userId: string) {
    const [memberships, publicWorkspaces] = await Promise.all([
      this.prisma.workspaceMember.findMany({
        where: { userId, workspace: { archivedAt: null } },
        orderBy: [{ workspace: { createdAt: 'asc' } }, { workspaceId: 'asc' }],
        select: { role: true, workspace: { select: workspaceSelect } }
      }),
      this.prisma.workspace.findMany({
        where: { archivedAt: null, private: false, members: { none: { userId } } },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: workspaceSelect
      })
    ]);
    return [
      ...memberships.map(({ workspace, role }) => ({ ...workspace, role })),
      ...publicWorkspaces.map((workspace) => ({ ...withoutMembers(workspace), role: 'PUBLIC' as const }))
    ];
  }

  async getById(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId, workspace: { archivedAt: null } },
      select: { role: true, workspace: { select: workspaceSelect } }
    });
    if (membership) return { ...membership.workspace, role: membership.role };

    const workspace = await this.prisma.workspace.findFirst({
      where: { id: workspaceId, archivedAt: null, private: false },
      select: workspaceSelect
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    return { ...workspace, role: 'PUBLIC' as const };
  }

  async update(workspaceId: string, userId: string, input: UpdateWorkspaceInput) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true }
    });
    if (!membership) throw new NotFoundException('Workspace not found');
    if (membership.role !== WorkspaceRole.OWNER) throw new ForbiddenException('Only the Space owner can update settings');
    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId, archivedAt: null },
      data: input,
      select: workspaceSelect
    });
    return { ...workspace, role: membership.role };
  }

  async archive(workspaceId: string, userId: string): Promise<void> {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true }
    });
    if (!membership) throw new NotFoundException('Workspace not found');
    if (membership.role !== WorkspaceRole.OWNER) throw new ForbiddenException('Only the Workspace owner can delete it');

    const archived = await this.prisma.workspace.updateMany({
      where: { id: workspaceId, archivedAt: null },
      data: { archivedAt: new Date() }
    });
    if (archived.count !== 1) throw new NotFoundException('Active Workspace not found');
  }

  async inviteMember(workspaceId: string, ownerId: string, input: InviteWorkspaceMemberInput) {
    const ownerMembership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: ownerId } },
      select: { role: true }
    });
    if (!ownerMembership) throw new NotFoundException('Workspace not found');
    if (ownerMembership.role !== WorkspaceRole.OWNER) throw new ForbiddenException('Only the Space owner can invite members');

    const user = await this.prisma.user.findFirst({
      where: { email: input.email, archivedAt: null },
      select: { id: true, displayName: true, avatarUrl: true }
    });
    if (!user) throw new NotFoundException('User not found');

    const membership = await this.prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
      create: { workspaceId, userId: user.id, role: input.role },
      update: {},
      select: {
        id: true,
        userId: true,
        role: true,
        user: { select: { displayName: true, avatarUrl: true } }
      }
    });
    return {
      id: membership.id,
      userId: membership.userId,
      role: membership.role,
      displayName: membership.user.displayName,
      initials: initials(membership.user.displayName),
      avatarUrl: membership.user.avatarUrl
    };
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




