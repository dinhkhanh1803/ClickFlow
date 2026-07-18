import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TaskPriority } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import type { CreateTemplateInput, InstantiateTemplateInput, TemplateStructure } from './productivity.schemas';
import { templateStructureSchema } from './productivity.schemas';

@Injectable()
export class TemplateService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  list(workspaceId: string) { return this.prisma.projectTemplate.findMany({ where: { workspaceId, archivedAt: null }, orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }], select: { id: true, name: true, description: true, sourceProjectId: true, createdAt: true, updatedAt: true } }); }
  async create(workspaceId: string, input: CreateTemplateInput) {
    const project = await this.prisma.project.findFirst({ where: { id: input.sourceProjectId, workspaceId, archivedAt: null }, select: {
      description: true, tone: true,
      statuses: { where: { archivedAt: null }, orderBy: { position: 'asc' }, select: { id: true, name: true, color: true, category: true, completed: true, position: true } },
      sections: { where: { archivedAt: null }, orderBy: { position: 'asc' }, select: { id: true, name: true, position: true } },
      tasks: { where: { archivedAt: null }, orderBy: [{ position: 'asc' }, { id: 'asc' }], select: { id: true, title: true, description: true, priority: true, position: true, statusId: true, sectionId: true, parentTaskId: true, checklistItems: { orderBy: { position: 'asc' }, select: { label: true, completed: true, position: true } } } }
    } });
    if (!project) throw new NotFoundException('Active source project not found');
    const structure: TemplateStructure = { version: 1, project: { description: project.description, tone: project.tone }, statuses: project.statuses.map((status) => ({ sourceId: status.id, ...status })), sections: project.sections.map((section) => ({ sourceId: section.id, name: section.name, position: section.position })), tasks: project.tasks.map((task) => ({ sourceId: task.id, title: task.title, description: task.description, priority: task.priority, position: task.position.toString(), statusSourceId: task.statusId, sectionSourceId: task.sectionId, parentSourceId: task.parentTaskId, checklist: task.checklistItems })) };
    return this.prisma.projectTemplate.create({ data: { workspaceId, sourceProjectId: input.sourceProjectId, name: input.name, description: input.description, structure: structure as Prisma.InputJsonValue }, select: { id: true, name: true, description: true, sourceProjectId: true, createdAt: true } });
  }
  async instantiate(workspaceId: string, templateId: string, key: string, input: InstantiateTemplateInput) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`template:${workspaceId}:${key}`}))`;
      const retry = await transaction.templateInstantiation.findUnique({ where: { workspaceId_idempotencyKey: { workspaceId, idempotencyKey: key } }, select: { project: true } });
      if (retry) return retry.project;
      const template = await transaction.projectTemplate.findFirst({ where: { id: templateId, workspaceId, archivedAt: null } });
      if (!template) throw new NotFoundException('Active template not found');
      const structure = templateStructureSchema.parse(template.structure);
      const maximum = await transaction.project.aggregate({ where: { workspaceId, parentId: null }, _max: { position: true } });
      const project = await transaction.project.create({ data: { workspaceId, name: input.name ?? template.name, description: structure.project.description, tone: structure.project.tone, position: (maximum._max.position ?? -1) + 1 } });
      const statusIds = new Map<string, string>();
      for (const status of structure.statuses) { const created = await transaction.taskStatus.create({ data: { workspaceId, projectId: project.id, scopeType: 'PROJECT', scopeId: project.id, name: status.name, color: status.color, category: status.category, completed: status.completed, position: status.position } }); statusIds.set(status.sourceId, created.id); }
      const sectionIds = new Map<string, string>();
      for (const section of structure.sections) { const created = await transaction.section.create({ data: { workspaceId, projectId: project.id, name: section.name, position: section.position } }); sectionIds.set(section.sourceId, created.id); }
      const taskIds = new Map<string, string>();
      for (const task of structure.tasks) {
        const statusId = statusIds.get(task.statusSourceId); if (!statusId) throw new ConflictException('Template references a missing status');
        const created = await transaction.task.create({ data: { workspaceId, projectId: project.id, sectionId: task.sectionSourceId ? sectionIds.get(task.sectionSourceId) : null, statusId, title: task.title, description: task.description, priority: task.priority as TaskPriority, position: new Prisma.Decimal(task.position), checklistItems: { create: task.checklist.map((item) => ({ workspaceId, label: item.label, completed: item.completed, position: item.position })) } } });
        taskIds.set(task.sourceId, created.id);
      }
      for (const task of structure.tasks.filter(({ parentSourceId }) => parentSourceId)) { const id = taskIds.get(task.sourceId); const parentTaskId = taskIds.get(task.parentSourceId!); if (!id || !parentTaskId) throw new ConflictException('Template references a missing parent task'); await transaction.task.update({ where: { id }, data: { parentTaskId } }); }
      await transaction.templateInstantiation.create({ data: { workspaceId, templateId, projectId: project.id, idempotencyKey: key } });
      return project;
    });
  }
  async archive(workspaceId: string, templateId: string) { const changed = await this.prisma.projectTemplate.updateMany({ where: { id: templateId, workspaceId, archivedAt: null }, data: { archivedAt: new Date() } }); if (!changed.count) throw new NotFoundException('Active template not found'); }
}
