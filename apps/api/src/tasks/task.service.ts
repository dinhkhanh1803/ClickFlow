import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type TaskStatus } from '@prisma/client';

import type { AuthClientContext } from '../auth/auth.service';
import { PrismaService } from '../database/prisma.service';
import type { CreateTaskInput, MoveTaskInput, TaskListInput, UpdateTaskInput } from './task.schemas';
import { assertValidParent, fractionalPosition, resolveCompletedAt, type TaskAncestor } from './task-rules';

const taskSelect = {
  id: true,
  workspaceId: true,
  projectId: true,
  sectionId: true,
  statusId: true,
  assigneeId: true,
  parentTaskId: true,
  title: true,
  description: true,
  priority: true,
  position: true,
  dueAt: true,
  completedAt: true,
  version: true,
  createdAt: true,
  updatedAt: true,
  archivedAt: true,
  assignee: { select: { id: true, displayName: true, avatarUrl: true } },
  status: { select: { id: true, name: true, color: true, completed: true } },
  taskTags: { select: { tag: { select: { id: true, name: true, color: true } } }, orderBy: { tag: { name: 'asc' as const } } },
  checklistItems: { select: { id: true, taskId: true, label: true, completed: true, position: true }, orderBy: { position: 'asc' as const } }
} as const;

type TaskRecord = Prisma.TaskGetPayload<{ select: typeof taskSelect }>;

export function buildTaskUpdateActivityMetadata(input: UpdateTaskInput): Prisma.InputJsonObject {
  return {
    changedFields: Object.keys(input).filter((field) => field !== 'version'),
    ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
    ...(input.statusId !== undefined ? { statusId: input.statusId } : {})
  };
}

function initials(displayName: string): string {
  return displayName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
}

function serializeTask(task: TaskRecord) {
  return {
    ...task,
    position: task.position.toNumber(),
    assignee: task.assignee ? { ...task.assignee, initials: initials(task.assignee.displayName) } : null,
    tags: task.taskTags.map(({ tag }) => tag),
    taskTags: undefined
  };
}

@Injectable()
export class TaskService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(workspaceId: string, query: TaskListInput) {
    const where: Prisma.TaskWhereInput = {
      workspaceId,
      projectId: query.projectId,
      sectionId: query.sectionId,
      statusId: query.statusId,
      assigneeId: query.assigneeId,
      archivedAt: query.archived === 'all' ? undefined : query.archived === 'archived' ? { not: null } : null,
      ...(query.search ? { title: { contains: query.search, mode: 'insensitive' } } : {}),
      ...(query.from || query.to ? { dueAt: { gte: query.from, lte: query.to } } : {})
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({ where, skip: (query.page - 1) * query.pageSize, take: query.pageSize, orderBy: [{ dueAt: 'asc' }, { position: 'asc' }, { id: 'asc' }], select: taskSelect }),
      this.prisma.task.count({ where })
    ]);
    return { items: items.map(serializeTask), page: query.page, pageSize: query.pageSize, total };
  }

  async get(workspaceId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, workspaceId }, select: taskSelect });
    if (!task) throw new NotFoundException('Task not found');
    return serializeTask(task);
  }

  async create(workspaceId: string, actorId: string, input: CreateTaskInput, context: AuthClientContext) {
    const task = await this.prisma.$transaction(async (transaction) => {
      const status = await this.assertReferences(transaction, workspaceId, input.projectId, input.statusId, input.sectionId, input.assigneeId);
      await this.assertParent(transaction, workspaceId, null, input.projectId, input.parentTaskId ?? null);
      await this.lockColumn(transaction, workspaceId, input.projectId, input.statusId);
      const maximum = await transaction.task.aggregate({ where: { workspaceId, projectId: input.projectId, statusId: input.statusId, archivedAt: null }, _max: { position: true } });
      const created = await transaction.task.create({
        data: {
          workspaceId,
          projectId: input.projectId,
          sectionId: input.sectionId,
          statusId: input.statusId,
          assigneeId: input.assigneeId,
          parentTaskId: input.parentTaskId,
          title: input.title,
          description: input.description,
          priority: input.priority,
          dueAt: input.dueAt,
          completedAt: status.completed ? new Date() : null,
          position: (maximum._max.position?.toNumber() ?? 0) + 1024
        },
        select: taskSelect
      });
      await this.recordActivity(transaction, workspaceId, actorId, 'TASK_CREATED', created.id, context.requestId, input.assigneeId ? { changedFields: ['assigneeId'], assigneeId: input.assigneeId } : {});
      return created;
    });
    return serializeTask(task);
  }

  async update(workspaceId: string, taskId: string, actorId: string, input: UpdateTaskInput, context: AuthClientContext) {
    const task = await this.prisma.$transaction(async (transaction) => {
      const current = await transaction.task.findFirst({ where: { id: taskId, workspaceId, archivedAt: null }, select: { id: true, projectId: true, statusId: true, completedAt: true } });
      if (!current) throw new NotFoundException('Active task not found');
      const statusId = input.statusId ?? current.statusId;
      const status = await this.assertReferences(transaction, workspaceId, current.projectId, statusId, input.sectionId, input.assigneeId);
      if (input.parentTaskId !== undefined) await this.assertParent(transaction, workspaceId, taskId, current.projectId, input.parentTaskId);
      const { version, ...fields } = input;
      let position: number | undefined;
      if (input.statusId && input.statusId !== current.statusId) {
        await this.lockColumn(transaction, workspaceId, current.projectId, input.statusId);
        position = await this.resolveMovePosition(transaction, workspaceId, current.projectId, taskId, { version, statusId: input.statusId });
      }
      const updated = await transaction.task.updateMany({
        where: { id: taskId, workspaceId, archivedAt: null, version },
        data: { ...fields, position, completedAt: resolveCompletedAt(status.completed, current.completedAt, new Date()), version: { increment: 1 } }
      });
      if (updated.count !== 1) throw new ConflictException('Task version conflict');
      await this.recordActivity(transaction, workspaceId, actorId, 'TASK_UPDATED', taskId, context.requestId, buildTaskUpdateActivityMetadata(input));
      return transaction.task.findUniqueOrThrow({ where: { id: taskId }, select: taskSelect });
    });
    return serializeTask(task);
  }

  async complete(workspaceId: string, taskId: string, actorId: string, input: { version: number; statusId: string }, context: AuthClientContext) {
    const task = await this.prisma.$transaction(async (transaction) => {
      const current = await transaction.task.findFirst({ where: { id: taskId, workspaceId, archivedAt: null }, select: { projectId: true, completedAt: true } });
      if (!current) throw new NotFoundException('Active task not found');
      const status = await this.assertStatus(transaction, workspaceId, current.projectId, input.statusId);
      if (!status.completed) throw new ConflictException('Completion requires a completed project status');
      const updated = await transaction.task.updateMany({ where: { id: taskId, workspaceId, archivedAt: null, version: input.version }, data: { statusId: input.statusId, completedAt: current.completedAt ?? new Date(), version: { increment: 1 } } });
      if (updated.count !== 1) throw new ConflictException('Task version conflict');
      await this.recordActivity(transaction, workspaceId, actorId, 'TASK_COMPLETED', taskId, context.requestId, { changedFields: ['statusId'], statusId: input.statusId });
      return transaction.task.findUniqueOrThrow({ where: { id: taskId }, select: taskSelect });
    });
    return serializeTask(task);
  }

  async move(workspaceId: string, taskId: string, actorId: string, input: MoveTaskInput, context: AuthClientContext) {
    const task = await this.prisma.$transaction(async (transaction) => {
      const current = await transaction.task.findFirst({ where: { id: taskId, workspaceId, archivedAt: null }, select: { projectId: true, completedAt: true } });
      if (!current) throw new NotFoundException('Active task not found');
      const status = await this.assertStatus(transaction, workspaceId, current.projectId, input.statusId);
      if (input.sectionId !== undefined) await this.assertSection(transaction, workspaceId, current.projectId, input.sectionId);
      await this.lockColumn(transaction, workspaceId, current.projectId, input.statusId);
      const position = await this.resolveMovePosition(transaction, workspaceId, current.projectId, taskId, input);
      const updated = await transaction.task.updateMany({
        where: { id: taskId, workspaceId, archivedAt: null, version: input.version },
        data: { statusId: input.statusId, sectionId: input.sectionId, position, completedAt: resolveCompletedAt(status.completed, current.completedAt, new Date()), version: { increment: 1 } }
      });
      if (updated.count !== 1) throw new ConflictException('Task version conflict');
      await this.recordActivity(transaction, workspaceId, actorId, 'TASK_MOVED', taskId, context.requestId, { changedFields: ['statusId', 'position'], statusId: input.statusId, position });
      return transaction.task.findUniqueOrThrow({ where: { id: taskId }, select: taskSelect });
    });
    return serializeTask(task);
  }

  async archive(workspaceId: string, taskId: string, actorId: string, version: number, context: AuthClientContext): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.task.updateMany({ where: { id: taskId, workspaceId, archivedAt: null, version }, data: { archivedAt: new Date(), version: { increment: 1 } } });
      if (updated.count !== 1) await this.throwMissingOrConflict(transaction, workspaceId, taskId);
      await this.recordActivity(transaction, workspaceId, actorId, 'TASK_ARCHIVED', taskId, context.requestId);
    });
  }

  async restore(workspaceId: string, taskId: string, actorId: string, version: number, context: AuthClientContext) {
    const task = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.task.updateMany({ where: { id: taskId, workspaceId, archivedAt: { not: null }, version }, data: { archivedAt: null, version: { increment: 1 } } });
      if (updated.count !== 1) await this.throwMissingOrConflict(transaction, workspaceId, taskId);
      await this.recordActivity(transaction, workspaceId, actorId, 'TASK_RESTORED', taskId, context.requestId);
      return transaction.task.findUniqueOrThrow({ where: { id: taskId }, select: taskSelect });
    });
    return serializeTask(task);
  }

  private async assertReferences(transaction: Prisma.TransactionClient, workspaceId: string, projectId: string, statusId: string, sectionId?: string | null, assigneeId?: string | null): Promise<TaskStatus> {
    const status = await this.assertStatus(transaction, workspaceId, projectId, statusId);
    if (sectionId !== undefined) await this.assertSection(transaction, workspaceId, projectId, sectionId);
    if (assigneeId) {
      const member = await transaction.workspaceMember.findFirst({ where: { workspaceId, userId: assigneeId }, select: { userId: true } });
      if (!member) throw new ConflictException('Assignee must be an active workspace member');
    }
    return status;
  }

  private async assertStatus(transaction: Prisma.TransactionClient, workspaceId: string, projectId: string, statusId: string): Promise<TaskStatus> {
    const status = await transaction.taskStatus.findFirst({ where: { id: statusId, workspaceId, projectId, archivedAt: null } });
    if (!status) throw new ConflictException('Status must belong to the same active project');
    return status;
  }

  private async assertSection(transaction: Prisma.TransactionClient, workspaceId: string, projectId: string, sectionId?: string | null): Promise<void> {
    if (!sectionId) return;
    const section = await transaction.section.findFirst({ where: { id: sectionId, workspaceId, projectId, archivedAt: null }, select: { id: true } });
    if (!section) throw new ConflictException('Section must belong to the same active project');
  }

  private async assertParent(transaction: Prisma.TransactionClient, workspaceId: string, taskId: string | null, projectId: string, parentTaskId: string | null): Promise<void> {
    if (!parentTaskId) return;
    const tasks = await transaction.task.findMany({ where: { workspaceId, projectId, archivedAt: null }, select: { id: true, projectId: true, parentTaskId: true } });
    const ancestors = new Map<string, TaskAncestor>(tasks.map((task) => [task.id, task]));
    assertValidParent(taskId, projectId, parentTaskId, ancestors);
  }

  private async resolveMovePosition(transaction: Prisma.TransactionClient, workspaceId: string, projectId: string, taskId: string, input: MoveTaskInput, allowRebalance = true): Promise<number> {
    const base = { workspaceId, projectId, statusId: input.statusId, archivedAt: null, NOT: { id: taskId } } as const;
    if (input.beforeTaskId) {
      const anchor = await transaction.task.findFirst({ where: { ...base, id: input.beforeTaskId }, select: { position: true } });
      if (!anchor) throw new ConflictException('beforeTaskId must be an active task in the target status');
      const previous = await transaction.task.findFirst({ where: { ...base, position: { lt: anchor.position } }, orderBy: { position: 'desc' }, select: { position: true } });
      const previousPosition = previous?.position.toNumber() ?? null;
      if (allowRebalance && previousPosition !== null && anchor.position.toNumber() - previousPosition < 0.000001) {
        await this.rebalanceColumn(transaction, workspaceId, projectId, input.statusId);
        return this.resolveMovePosition(transaction, workspaceId, projectId, taskId, input, false);
      }
      return fractionalPosition(previousPosition, anchor.position.toNumber());
    }
    if (input.afterTaskId) {
      const anchor = await transaction.task.findFirst({ where: { ...base, id: input.afterTaskId }, select: { position: true } });
      if (!anchor) throw new ConflictException('afterTaskId must be an active task in the target status');
      const next = await transaction.task.findFirst({ where: { ...base, position: { gt: anchor.position } }, orderBy: { position: 'asc' }, select: { position: true } });
      const nextPosition = next?.position.toNumber() ?? null;
      if (allowRebalance && nextPosition !== null && nextPosition - anchor.position.toNumber() < 0.000001) {
        await this.rebalanceColumn(transaction, workspaceId, projectId, input.statusId);
        return this.resolveMovePosition(transaction, workspaceId, projectId, taskId, input, false);
      }
      return fractionalPosition(anchor.position.toNumber(), nextPosition);
    }
    const last = await transaction.task.findFirst({ where: base, orderBy: { position: 'desc' }, select: { position: true } });
    return fractionalPosition(last?.position.toNumber() ?? null, null);
  }

  private async rebalanceColumn(transaction: Prisma.TransactionClient, workspaceId: string, projectId: string, statusId: string): Promise<void> {
    const tasks = await transaction.task.findMany({ where: { workspaceId, projectId, statusId, archivedAt: null }, orderBy: [{ position: 'asc' }, { id: 'asc' }], select: { id: true } });
    for (const [index, task] of tasks.entries()) {
      await transaction.task.update({ where: { id: task.id }, data: { position: (index + 1) * 1024 } });
    }
  }

  private lockColumn(transaction: Prisma.TransactionClient, workspaceId: string, projectId: string, statusId: string) {
    return transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${workspaceId}:${projectId}:${statusId}`}))`;
  }

  private async throwMissingOrConflict(transaction: Prisma.TransactionClient, workspaceId: string, taskId: string): Promise<never> {
    const exists = await transaction.task.count({ where: { id: taskId, workspaceId } });
    if (!exists) throw new NotFoundException('Task not found');
    throw new ConflictException('Task version conflict');
  }

  private recordActivity(transaction: Prisma.TransactionClient, workspaceId: string, actorId: string, eventType: string, taskId: string, requestId?: string, metadata: Prisma.InputJsonValue = {}) {
    return transaction.activityLog.create({ data: { workspaceId, actorId, eventType, subjectType: 'TASK', subjectId: taskId, requestId, metadata } });
  }
}
