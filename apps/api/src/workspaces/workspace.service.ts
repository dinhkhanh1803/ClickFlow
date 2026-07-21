import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StatusScopeType, WorkspaceRole } from '@prisma/client';

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
  archivedAt: true,
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

  async listArchivedForUser(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId, role: WorkspaceRole.OWNER, workspace: { archivedAt: { not: null } } },
      orderBy: [{ workspace: { updatedAt: 'desc' } }, { workspaceId: 'asc' }],
      select: { role: true, workspace: { select: workspaceSelect } }
    });
    return memberships.map(({ workspace, role }) => ({ ...workspace, role }));
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

  async restore(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true }
    });
    if (!membership) throw new NotFoundException('Workspace not found');
    if (membership.role !== WorkspaceRole.OWNER) throw new ForbiddenException('Only the Workspace owner can restore it');
    const restored = await this.prisma.workspace.updateMany({ where: { id: workspaceId, archivedAt: { not: null } }, data: { archivedAt: null } });
    if (restored.count !== 1) throw new NotFoundException('Archived Workspace not found');
    const workspace = await this.prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: workspaceSelect });
    return { ...workspace, role: membership.role };
  }

  async duplicate(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true }
    });
    if (!membership) throw new NotFoundException('Workspace not found');
    if (membership.role !== WorkspaceRole.OWNER) throw new ForbiddenException('Only the Workspace owner can duplicate it');
    const source = await this.prisma.workspace.findFirst({
      where: { id: workspaceId, archivedAt: null },
      include: {
        projects: { where: { archivedAt: null }, orderBy: [{ parentId: 'asc' }, { position: 'asc' }, { id: 'asc' }] },
        sections: { where: { archivedAt: null }, orderBy: [{ position: 'asc' }, { id: 'asc' }] },
        statuses: { where: { archivedAt: null }, orderBy: [{ position: 'asc' }, { id: 'asc' }] },
        tasks: { where: { archivedAt: null }, include: { taskAssignments: true }, orderBy: [{ position: 'asc' }, { id: 'asc' }] },
        documents: { where: { archivedAt: null }, orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }] }
      }
    });
    if (!source) throw new NotFoundException('Active Workspace not found');

    const duplicated = await this.prisma.$transaction(async (transaction) => {
      const workspace = await transaction.workspace.create({
        data: {
          createdById: userId,
          name: source.name + ' copy',
          description: source.description,
          tone: source.tone,
          private: source.private,
          publicAccess: source.publicAccess,
          timezone: source.timezone,
          locale: source.locale,
          settings: source.settings as Prisma.InputJsonValue
        },
        select: workspaceSelect
      });
      await transaction.workspaceMember.create({ data: { workspaceId: workspace.id, userId, role: WorkspaceRole.OWNER } });

      const projectMap = new Map<string, string>();
      for (const project of source.projects) {
        const created = await transaction.project.create({
          data: {
            workspaceId: workspace.id,
            parentId: project.parentId ? projectMap.get(project.parentId) ?? null : null,
            name: project.name,
            description: project.description,
            tone: project.tone,
            position: project.position,
            deadline: project.deadline
          },
          select: { id: true }
        });
        projectMap.set(project.id, created.id);
      }

      const sectionMap = new Map<string, string>();
      for (const section of source.sections) {
        const projectId = projectMap.get(section.projectId);
        if (!projectId) continue;
        const created = await transaction.section.create({ data: { workspaceId: workspace.id, projectId, name: section.name, position: section.position }, select: { id: true } });
        sectionMap.set(section.id, created.id);
      }

      const statusMap = new Map<string, string>();
      for (const status of source.statuses) {
        const projectId = status.projectId ? projectMap.get(status.projectId) ?? null : null;
        const sectionId = status.sectionId ? sectionMap.get(status.sectionId) ?? null : null;
        const scopeId = status.scopeType === StatusScopeType.WORKSPACE ? workspace.id : status.scopeType === StatusScopeType.PROJECT ? projectMap.get(status.scopeId) : sectionMap.get(status.scopeId);
        if (!scopeId) continue;
        const created = await transaction.taskStatus.create({
          data: { workspaceId: workspace.id, projectId, sectionId, scopeType: status.scopeType, scopeId, name: status.name, color: status.color, category: status.category, completed: status.completed, isSystem: status.isSystem, position: status.position },
          select: { id: true }
        });
        statusMap.set(status.id, created.id);
      }

      const taskMap = new Map<string, string>();
      for (const task of source.tasks) {
        const projectId = projectMap.get(task.projectId);
        const statusId = statusMap.get(task.statusId);
        if (!projectId || !statusId) continue;
        const created = await transaction.task.create({
          data: { workspaceId: workspace.id, projectId, sectionId: task.sectionId ? sectionMap.get(task.sectionId) ?? null : null, statusId, assigneeId: task.assigneeId, title: task.title, description: task.description, priority: task.priority, position: task.position, dueAt: task.dueAt, estimateMinutes: task.estimateMinutes, completedAt: task.completedAt },
          select: { id: true }
        });
        taskMap.set(task.id, created.id);
        if (task.taskAssignments.length) await transaction.taskAssignment.createMany({ data: task.taskAssignments.map((assignment) => ({ workspaceId: workspace.id, taskId: created.id, userId: assignment.userId, assignedAt: assignment.assignedAt })), skipDuplicates: true });
      }
      for (const task of source.tasks) {
        if (!task.parentTaskId) continue;
        const taskId = taskMap.get(task.id);
        const parentTaskId = taskMap.get(task.parentTaskId);
        if (taskId && parentTaskId) await transaction.task.update({ where: { id: taskId }, data: { parentTaskId } });
      }

      for (const document of source.documents) {
        await transaction.document.create({ data: { workspaceId: workspace.id, projectId: document.projectId ? projectMap.get(document.projectId) ?? null : null, sectionId: document.sectionId ? sectionMap.get(document.sectionId) ?? null : null, title: document.title, content: document.content, contentVersion: 1 } });
      }
      return workspace;
    });
    return { ...duplicated, role: WorkspaceRole.OWNER };
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




