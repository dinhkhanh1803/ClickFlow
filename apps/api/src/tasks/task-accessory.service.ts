import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type { AuthClientContext } from '../auth/auth.service';
import { PrismaService } from '../database/prisma.service';
import type { CreateChecklistItemInput, CreateTagInput, UpdateChecklistItemInput } from './task.schemas';

const checklistSelect = { id: true, taskId: true, label: true, completed: true, position: true, createdAt: true, updatedAt: true } as const;
const tagSelect = { id: true, workspaceId: true, name: true, color: true, createdAt: true, updatedAt: true, archivedAt: true } as const;

@Injectable()
export class TaskAccessoryService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listChecklist(workspaceId: string, taskId: string) {
    await this.assertTask(workspaceId, taskId);
    return this.prisma.checklistItem.findMany({ where: { workspaceId, taskId }, orderBy: [{ position: 'asc' }, { id: 'asc' }], select: checklistSelect });
  }

  async createChecklist(workspaceId: string, taskId: string, actorId: string, input: CreateChecklistItemInput, context: AuthClientContext) {
    await this.assertTask(workspaceId, taskId);
    return this.prisma.$transaction(async (transaction) => {
      const maximum = await transaction.checklistItem.aggregate({ where: { workspaceId, taskId }, _max: { position: true } });
      const item = await transaction.checklistItem.create({ data: { workspaceId, taskId, label: input.label, position: (maximum._max.position ?? -1) + 1 }, select: checklistSelect });
      await this.recordActivity(transaction, workspaceId, actorId, 'CHECKLIST_ITEM_CREATED', taskId, context.requestId, { checklistItemId: item.id });
      return item;
    });
  }

  async updateChecklist(workspaceId: string, taskId: string, itemId: string, actorId: string, input: UpdateChecklistItemInput, context: AuthClientContext) {
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.checklistItem.updateMany({ where: { id: itemId, workspaceId, taskId }, data: input });
      if (updated.count !== 1) throw new NotFoundException('Checklist item not found');
      await this.recordActivity(transaction, workspaceId, actorId, input.completed === undefined ? 'CHECKLIST_ITEM_UPDATED' : 'CHECKLIST_ITEM_TOGGLED', taskId, context.requestId, { checklistItemId: itemId });
      return transaction.checklistItem.findUniqueOrThrow({ where: { id: itemId }, select: checklistSelect });
    });
  }

  async deleteChecklist(workspaceId: string, taskId: string, itemId: string, actorId: string, context: AuthClientContext): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const removed = await transaction.checklistItem.deleteMany({ where: { id: itemId, workspaceId, taskId } });
      if (removed.count !== 1) throw new NotFoundException('Checklist item not found');
      await this.recordActivity(transaction, workspaceId, actorId, 'CHECKLIST_ITEM_DELETED', taskId, context.requestId, { checklistItemId: itemId });
    });
  }

  listTags(workspaceId: string) {
    return this.prisma.tag.findMany({ where: { workspaceId, archivedAt: null }, orderBy: [{ name: 'asc' }, { id: 'asc' }], select: tagSelect });
  }

  async createTag(workspaceId: string, actorId: string, input: CreateTagInput, context: AuthClientContext) {
    return this.prisma.$transaction(async (transaction) => {
      const tag = await transaction.tag.create({ data: { workspaceId, ...input }, select: tagSelect });
      await transaction.activityLog.create({ data: { workspaceId, actorId, eventType: 'TAG_CREATED', subjectType: 'TAG', subjectId: tag.id, requestId: context.requestId } });
      return tag;
    });
  }

  async attachTag(workspaceId: string, taskId: string, tagId: string, actorId: string, context: AuthClientContext): Promise<void> {
    await this.assertTask(workspaceId, taskId);
    const tag = await this.prisma.tag.findFirst({ where: { id: tagId, workspaceId, archivedAt: null }, select: { id: true } });
    if (!tag) throw new ConflictException('Tag must belong to the same workspace');
    await this.prisma.$transaction(async (transaction) => {
      await transaction.taskTag.upsert({ where: { taskId_tagId: { taskId, tagId } }, create: { workspaceId, taskId, tagId }, update: {} });
      await this.recordActivity(transaction, workspaceId, actorId, 'TASK_TAG_ATTACHED', taskId, context.requestId, { tagId });
    });
  }

  async detachTag(workspaceId: string, taskId: string, tagId: string, actorId: string, context: AuthClientContext): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const removed = await transaction.taskTag.deleteMany({ where: { workspaceId, taskId, tagId } });
      if (removed.count !== 1) throw new NotFoundException('Task tag not found');
      await this.recordActivity(transaction, workspaceId, actorId, 'TASK_TAG_DETACHED', taskId, context.requestId, { tagId });
    });
  }

  private async assertTask(workspaceId: string, taskId: string): Promise<void> {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, workspaceId, archivedAt: null }, select: { id: true } });
    if (!task) throw new NotFoundException('Active task not found');
  }

  private recordActivity(transaction: Prisma.TransactionClient, workspaceId: string, actorId: string, eventType: string, taskId: string, requestId?: string, metadata: Prisma.InputJsonValue = {}) {
    return transaction.activityLog.create({ data: { workspaceId, actorId, eventType, subjectType: 'TASK', subjectId: taskId, requestId, metadata } });
  }
}
