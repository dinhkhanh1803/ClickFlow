import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import type { UpdateSettingsInput } from './productivity.schemas';
import { assertLocale, assertTimezone } from './settings-rules';

@Injectable()
export class ArchiveSettingsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  async archive(workspaceId: string) {
    const [projects, tasks, templates] = await this.prisma.$transaction([
      this.prisma.project.findMany({ where: { workspaceId, archivedAt: { not: null } }, select: { id: true, name: true, archivedAt: true } }),
      this.prisma.task.findMany({ where: { workspaceId, archivedAt: { not: null } }, select: { id: true, title: true, projectId: true, archivedAt: true } }),
      this.prisma.projectTemplate.findMany({ where: { workspaceId, archivedAt: { not: null } }, select: { id: true, name: true, archivedAt: true } })
    ]);
    return { projects, tasks, templates };
  }
  async restore(workspaceId: string, actorId: string, type: 'project' | 'task' | 'template', id: string, requestId?: string): Promise<void> {
    if (!['project', 'task', 'template'].includes(type)) throw new BadRequestException('Unsupported archive resource type');
    await this.prisma.$transaction(async (transaction) => {
      if (type === 'project') {
        const item = await transaction.project.findFirst({ where: { id, workspaceId, archivedAt: { not: null } }, select: { parentId: true } });
        if (!item) throw new NotFoundException('Archived project not found');
        if (item.parentId && !await transaction.project.findFirst({ where: { id: item.parentId, workspaceId, archivedAt: null } })) throw new ConflictException('Parent project must be active before restore');
        await transaction.project.update({ where: { id }, data: { archivedAt: null } });
      } else if (type === 'task') {
        const item = await transaction.task.findFirst({ where: { id, workspaceId, archivedAt: { not: null } }, select: { projectId: true, statusId: true } });
        if (!item) throw new NotFoundException('Archived task not found');
        const [project, status] = await Promise.all([transaction.project.findFirst({ where: { id: item.projectId, workspaceId, archivedAt: null } }), transaction.taskStatus.findFirst({ where: { id: item.statusId, workspaceId, archivedAt: null } })]);
        if (!project || !status) throw new ConflictException('Task project and status must be active before restore');
        await transaction.task.update({ where: { id }, data: { archivedAt: null } });
      } else {
        const changed = await transaction.projectTemplate.updateMany({ where: { id, workspaceId, archivedAt: { not: null } }, data: { archivedAt: null } });
        if (!changed.count) throw new NotFoundException('Archived template not found');
      }
      await transaction.activityLog.create({ data: { workspaceId, actorId, eventType: `${type.toUpperCase()}_RESTORED`, subjectType: type.toUpperCase(), subjectId: id, requestId } });
    });
  }
  async getSettings(workspaceId: string) { const workspace = await this.prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { timezone: true, locale: true, settings: true } }); return { timezone: workspace.timezone, locale: workspace.locale, preferences: workspace.settings }; }
  async updateSettings(workspaceId: string, input: UpdateSettingsInput) {
    if (input.timezone) assertTimezone(input.timezone); if (input.locale) assertLocale(input.locale);
    const current = await this.prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { settings: true } });
    const preferences = input.preferences ? { ...(current.settings as Record<string, Prisma.JsonValue>), ...input.preferences } : undefined;
    const workspace = await this.prisma.workspace.update({ where: { id: workspaceId }, data: { timezone: input.timezone, locale: input.locale, settings: preferences }, select: { timezone: true, locale: true, settings: true } });
    return { timezone: workspace.timezone, locale: workspace.locale, preferences: workspace.settings };
  }
}
