import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StatusScopeType, type StatusCategory as PrismaStatusCategory } from '@prisma/client';

import type { AuthClientContext } from '../auth/auth.service';
import { PrismaService } from '../database/prisma.service';
import type { CreateSectionInput, CreateStatusInput, DeleteStatusInput, ReorderInput, UpdateSectionInput, UpdateStatusInput } from './project.schemas';
import { assertCompleteReorder } from './reorder';
import { toApiStatusCategory, toPrismaStatusCategory } from './status-category';

const statusSelect = {
  id: true,
  projectId: true,
  name: true,
  color: true,
  category: true,
  completed: true,
  position: true,
  isSystem: true
} as const;

const sectionSelect = { id: true, projectId: true, name: true, position: true } as const;

function serializeStatus<Status extends { category: PrismaStatusCategory }>(status: Status) {
  return { ...status, category: toApiStatusCategory(status.category) };
}

@Injectable()
export class ProjectStructureService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listStatuses(workspaceId: string, projectId: string) {
    await this.assertProject(workspaceId, projectId);
    const statuses = await this.prisma.taskStatus.findMany({
      where: { workspaceId, projectId, archivedAt: null },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
      select: statusSelect
    });
    return statuses.map(serializeStatus);
  }

  async createStatus(workspaceId: string, projectId: string, actorId: string, input: CreateStatusInput, context: AuthClientContext) {
    await this.assertProject(workspaceId, projectId);
    return this.prisma.$transaction(async (transaction) => {
      const maximum = await transaction.taskStatus.aggregate({
        where: { workspaceId, projectId, scopeType: StatusScopeType.PROJECT },
        _max: { position: true }
      });
      const storageCategory = toPrismaStatusCategory(input.category);
      const created = await transaction.taskStatus.create({
        data: {
          workspaceId,
          projectId,
          scopeType: StatusScopeType.PROJECT,
          scopeId: projectId,
          name: input.name,
          color: input.color,
          category: storageCategory,
          completed: input.category === 'COMPLETED',
          position: (maximum._max.position ?? -1) + 1
        },
        select: statusSelect
      });
      await this.recordActivity(transaction, workspaceId, actorId, 'STATUS_CREATED', 'STATUS', created.id, context.requestId);
      return serializeStatus(created);
    });
  }

  async updateStatus(workspaceId: string, projectId: string, statusId: string, actorId: string, input: UpdateStatusInput, context: AuthClientContext) {
    return this.prisma.$transaction(async (transaction) => {
      const { category, ...fields } = input;
      const data = {
        ...fields,
        category: category ? toPrismaStatusCategory(category) : undefined,
        completed: category ? category === 'COMPLETED' : undefined
      };
      const updated = await transaction.taskStatus.updateMany({
        where: { id: statusId, workspaceId, projectId, archivedAt: null },
        data
      });
      if (updated.count !== 1) throw new NotFoundException('Project status not found');
      await this.recordActivity(transaction, workspaceId, actorId, 'STATUS_UPDATED', 'STATUS', statusId, context.requestId);
      const status = await transaction.taskStatus.findUniqueOrThrow({ where: { id: statusId }, select: statusSelect });
      return serializeStatus(status);
    });
  }

  async reorderStatuses(workspaceId: string, projectId: string, actorId: string, input: ReorderInput, context: AuthClientContext) {
    const statuses = await this.listStatuses(workspaceId, projectId);
    assertCompleteReorder(statuses.map(({ id }) => id), input.orderedIds);
    await this.prisma.$transaction(async (transaction) => {
      for (const [index, id] of input.orderedIds.entries()) {
        await transaction.taskStatus.update({ where: { id }, data: { position: -1_000_000 - index } });
      }
      for (const [index, id] of input.orderedIds.entries()) {
        await transaction.taskStatus.update({ where: { id }, data: { position: index } });
      }
      await this.recordActivity(transaction, workspaceId, actorId, 'STATUSES_REORDERED', 'PROJECT', projectId, context.requestId);
    });
    return this.listStatuses(workspaceId, projectId);
  }

  async deleteStatus(workspaceId: string, projectId: string, statusId: string, actorId: string, input: DeleteStatusInput, context: AuthClientContext): Promise<void> {
    const status = await this.prisma.taskStatus.findFirst({
      where: { id: statusId, workspaceId, projectId, scopeType: StatusScopeType.PROJECT, archivedAt: null },
      select: { id: true, isSystem: true }
    });
    if (!status) throw new NotFoundException('Project status not found');
    if (status.isSystem) throw new ConflictException('Default statuses cannot be deleted');
    const usedByTasks = await this.prisma.task.count({ where: { workspaceId, projectId, statusId } });
    if (usedByTasks > 0 && !input.replacementStatusId) {
      throw new ConflictException('A replacement status is required while tasks use this status');
    }
    if (input.replacementStatusId) {
      const replacement = await this.prisma.taskStatus.findFirst({
        where: {
          id: input.replacementStatusId,
          workspaceId,
          projectId,
          scopeType: StatusScopeType.PROJECT,
          archivedAt: null,
          NOT: { id: statusId }
        },
        select: { id: true }
      });
      if (!replacement) throw new ConflictException('Replacement status must be active and belong to the same project');
    }
    await this.prisma.$transaction(async (transaction) => {
      if (input.replacementStatusId) {
        await transaction.task.updateMany({
          where: { workspaceId, projectId, statusId },
          data: { statusId: input.replacementStatusId }
        });
      }
      await transaction.taskStatus.delete({ where: { id: statusId } });
      await this.recordActivity(transaction, workspaceId, actorId, 'STATUS_ARCHIVED', 'STATUS', statusId, context.requestId);
    });
  }

  async listSections(workspaceId: string, projectId: string) {
    await this.assertProject(workspaceId, projectId);
    return this.prisma.section.findMany({
      where: { workspaceId, projectId, archivedAt: null },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
      select: sectionSelect
    });
  }

  async createSection(workspaceId: string, projectId: string, actorId: string, input: CreateSectionInput, context: AuthClientContext) {
    await this.assertProject(workspaceId, projectId);
    return this.prisma.$transaction(async (transaction) => {
      const maximum = await transaction.section.aggregate({ where: { workspaceId, projectId }, _max: { position: true } });
      const created = await transaction.section.create({
        data: { workspaceId, projectId, name: input.name, position: (maximum._max.position ?? -1) + 1 },
        select: sectionSelect
      });
      await this.recordActivity(transaction, workspaceId, actorId, 'SECTION_CREATED', 'SECTION', created.id, context.requestId);
      return created;
    });
  }

  async updateSection(workspaceId: string, projectId: string, sectionId: string, actorId: string, input: UpdateSectionInput, context: AuthClientContext) {
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.section.updateMany({
        where: { id: sectionId, workspaceId, projectId, archivedAt: null },
        data: input
      });
      if (updated.count !== 1) throw new NotFoundException('Project section not found');
      await this.recordActivity(transaction, workspaceId, actorId, 'SECTION_UPDATED', 'SECTION', sectionId, context.requestId);
      return transaction.section.findUniqueOrThrow({ where: { id: sectionId }, select: sectionSelect });
    });
  }

  async reorderSections(workspaceId: string, projectId: string, actorId: string, input: ReorderInput, context: AuthClientContext) {
    const sections = await this.listSections(workspaceId, projectId);
    assertCompleteReorder(sections.map(({ id }) => id), input.orderedIds);
    await this.prisma.$transaction(async (transaction) => {
      for (const [index, id] of input.orderedIds.entries()) {
        await transaction.section.update({ where: { id }, data: { position: -1_000_000 - index } });
      }
      for (const [index, id] of input.orderedIds.entries()) {
        await transaction.section.update({ where: { id }, data: { position: index } });
      }
      await this.recordActivity(transaction, workspaceId, actorId, 'SECTIONS_REORDERED', 'PROJECT', projectId, context.requestId);
    });
    return this.listSections(workspaceId, projectId);
  }

  async archiveSection(workspaceId: string, projectId: string, sectionId: string, actorId: string, context: AuthClientContext): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const archived = await transaction.section.updateMany({
        where: { id: sectionId, workspaceId, projectId, archivedAt: null },
        data: { archivedAt: new Date() }
      });
      if (archived.count !== 1) throw new NotFoundException('Active project section not found');
      await this.recordActivity(transaction, workspaceId, actorId, 'SECTION_ARCHIVED', 'SECTION', sectionId, context.requestId);
    });
  }

  private async assertProject(workspaceId: string, projectId: string): Promise<void> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId, archivedAt: null },
      select: { id: true }
    });
    if (!project) throw new NotFoundException('Active project not found');
  }

  private recordActivity(
    transaction: Prisma.TransactionClient,
    workspaceId: string,
    actorId: string,
    eventType: string,
    subjectType: string,
    subjectId: string,
    requestId?: string
  ) {
    return transaction.activityLog.create({
      data: { workspaceId, actorId, eventType, subjectType, subjectId, requestId }
    });
  }
}
