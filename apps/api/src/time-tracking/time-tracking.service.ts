import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type { AuthClientContext } from '../auth/auth.service';
import { PrismaService } from '../database/prisma.service';
import type { CreateTimeEntryInput, StartTimerInput, TimeEntryListInput, UpdateTimeEntryInput } from './time-tracking.schemas';
import { assertValidManualInterval, durationSeconds } from './time-rules';

const entrySelect = {
  id: true,
  workspaceId: true,
  taskId: true,
  userId: true,
  startedAt: true,
  endedAt: true,
  durationSeconds: true,
  note: true,
  createdAt: true,
  updatedAt: true,
  archivedAt: true
} as const;

@Injectable()
export class TimeTrackingService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async current(workspaceId: string, userId: string) {
    const timer = await this.prisma.timeEntry.findFirst({ where: { workspaceId, userId, endedAt: null, archivedAt: null }, select: entrySelect });
    return { timer };
  }

  async start(workspaceId: string, userId: string, idempotencyKey: string, input: StartTimerInput, context: AuthClientContext) {
    const retried = await this.prisma.timeEntry.findFirst({ where: { workspaceId, userId, startIdempotencyKey: idempotencyKey }, select: entrySelect });
    if (retried) return retried;
    await this.assertTask(workspaceId, input.taskId);

    return this.prisma.$transaction(async (transaction) => {
      await this.lockUser(transaction, userId);
      const retryAfterLock = await transaction.timeEntry.findFirst({ where: { workspaceId, userId, startIdempotencyKey: idempotencyKey }, select: entrySelect });
      if (retryAfterLock) return retryAfterLock;
      const running = await transaction.timeEntry.findFirst({ where: { userId, endedAt: null, archivedAt: null }, select: { id: true } });
      if (running) throw new ConflictException('The user already has a running timer');
      const entry = await transaction.timeEntry.create({
        data: { workspaceId, taskId: input.taskId, userId, startedAt: new Date(), note: input.note, startIdempotencyKey: idempotencyKey },
        select: entrySelect
      });
      await this.recordActivity(transaction, workspaceId, userId, 'TIMER_STARTED', input.taskId, entry.id, context.requestId);
      return entry;
    });
  }

  async stop(workspaceId: string, userId: string, idempotencyKey: string, context: AuthClientContext) {
    const retried = await this.prisma.timeEntry.findFirst({ where: { workspaceId, userId, stopIdempotencyKey: idempotencyKey }, select: entrySelect });
    if (retried) return retried;

    return this.prisma.$transaction(async (transaction) => {
      await this.lockUser(transaction, userId);
      const retryAfterLock = await transaction.timeEntry.findFirst({ where: { workspaceId, userId, stopIdempotencyKey: idempotencyKey }, select: entrySelect });
      if (retryAfterLock) return retryAfterLock;
      const running = await transaction.timeEntry.findFirst({ where: { workspaceId, userId, endedAt: null, archivedAt: null }, select: { id: true, taskId: true, startedAt: true } });
      if (!running) throw new ConflictException('No running timer exists in this workspace');
      const endedAt = new Date();
      const duration = durationSeconds(running.startedAt, endedAt);
      const stopped = await transaction.timeEntry.updateMany({
        where: { id: running.id, workspaceId, userId, endedAt: null, archivedAt: null },
        data: { endedAt, durationSeconds: duration, stopIdempotencyKey: idempotencyKey }
      });
      if (stopped.count !== 1) throw new ConflictException('Timer was already stopped');
      await this.recordActivity(transaction, workspaceId, userId, 'TIMER_STOPPED', running.taskId, running.id, context.requestId, { durationSeconds: duration });
      return transaction.timeEntry.findUniqueOrThrow({ where: { id: running.id }, select: entrySelect });
    });
  }

  async list(workspaceId: string, userId: string, query: TimeEntryListInput) {
    const where: Prisma.TimeEntryWhereInput = {
      workspaceId,
      userId,
      taskId: query.taskId,
      task: query.projectId ? { projectId: query.projectId } : undefined,
      archivedAt: query.archived === 'all' ? undefined : query.archived === 'archived' ? { not: null } : null,
      ...(query.from || query.to ? {
        startedAt: query.to ? { lt: query.to } : undefined,
        OR: query.from ? [{ endedAt: null }, { endedAt: { gt: query.from } }] : undefined
      } : {})
    };
    const [items, total, aggregate] = await this.prisma.$transaction([
      this.prisma.timeEntry.findMany({ where, skip: (query.page - 1) * query.pageSize, take: query.pageSize, orderBy: [{ startedAt: 'desc' }, { id: 'desc' }], select: entrySelect }),
      this.prisma.timeEntry.count({ where }),
      this.prisma.timeEntry.aggregate({ where, _sum: { durationSeconds: true } })
    ]);
    return { items, page: query.page, pageSize: query.pageSize, total, totalDurationSeconds: aggregate._sum.durationSeconds ?? 0 };
  }

  async get(workspaceId: string, userId: string, entryId: string) {
    const entry = await this.prisma.timeEntry.findFirst({ where: { id: entryId, workspaceId, userId }, select: entrySelect });
    if (!entry) throw new NotFoundException('Time entry not found');
    return entry;
  }

  async create(workspaceId: string, userId: string, input: CreateTimeEntryInput, context: AuthClientContext) {
    assertValidManualInterval(input.startedAt, input.endedAt);
    await this.assertTask(workspaceId, input.taskId);
    return this.prisma.$transaction(async (transaction) => {
      await this.lockUser(transaction, userId);
      await this.assertNoOverlap(transaction, userId, input.startedAt, input.endedAt);
      const entry = await transaction.timeEntry.create({
        data: { workspaceId, taskId: input.taskId, userId, startedAt: input.startedAt, endedAt: input.endedAt, durationSeconds: durationSeconds(input.startedAt, input.endedAt), note: input.note },
        select: entrySelect
      });
      await this.recordActivity(transaction, workspaceId, userId, 'TIME_ENTRY_CREATED', input.taskId, entry.id, context.requestId, { durationSeconds: entry.durationSeconds });
      return entry;
    });
  }

  async update(workspaceId: string, userId: string, entryId: string, input: UpdateTimeEntryInput, context: AuthClientContext) {
    return this.prisma.$transaction(async (transaction) => {
      await this.lockUser(transaction, userId);
      const current = await transaction.timeEntry.findFirst({ where: { id: entryId, workspaceId, userId, archivedAt: null }, select: { id: true, taskId: true, startedAt: true, endedAt: true } });
      if (!current) throw new NotFoundException('Active time entry not found');
      if (!current.endedAt) throw new ConflictException('A running timer must be stopped through the timer endpoint');
      const startedAt = input.startedAt ?? current.startedAt;
      const endedAt = input.endedAt ?? current.endedAt;
      assertValidManualInterval(startedAt, endedAt);
      await this.assertNoOverlap(transaction, userId, startedAt, endedAt, entryId);
      await transaction.timeEntry.update({ where: { id: entryId }, data: { ...input, durationSeconds: durationSeconds(startedAt, endedAt) } });
      await this.recordActivity(transaction, workspaceId, userId, 'TIME_ENTRY_UPDATED', current.taskId, entryId, context.requestId);
      return transaction.timeEntry.findUniqueOrThrow({ where: { id: entryId }, select: entrySelect });
    });
  }

  async archive(workspaceId: string, userId: string, entryId: string, context: AuthClientContext): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const current = await transaction.timeEntry.findFirst({ where: { id: entryId, workspaceId, userId, archivedAt: null }, select: { id: true, taskId: true, endedAt: true } });
      if (!current) throw new NotFoundException('Active time entry not found');
      if (!current.endedAt) throw new ConflictException('A running timer cannot be archived');
      await transaction.timeEntry.update({ where: { id: entryId }, data: { archivedAt: new Date() } });
      await this.recordActivity(transaction, workspaceId, userId, 'TIME_ENTRY_ARCHIVED', current.taskId, entryId, context.requestId);
    });
  }

  private async assertTask(workspaceId: string, taskId: string): Promise<void> {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, workspaceId, archivedAt: null }, select: { id: true } });
    if (!task) throw new NotFoundException('Active task not found');
  }

  private async assertNoOverlap(transaction: Prisma.TransactionClient, userId: string, startedAt: Date, endedAt: Date, excludeId?: string): Promise<void> {
    const overlapping = await transaction.timeEntry.count({
      where: {
        userId,
        archivedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
        startedAt: { lt: endedAt },
        OR: [{ endedAt: null }, { endedAt: { gt: startedAt } }]
      }
    });
    if (overlapping) throw new ConflictException('Time entry overlaps another active entry for this user');
  }

  private lockUser(transaction: Prisma.TransactionClient, userId: string) {
    return transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`time:${userId}`}))`;
  }

  private recordActivity(transaction: Prisma.TransactionClient, workspaceId: string, actorId: string, eventType: string, taskId: string, timeEntryId: string, requestId?: string, metadata: Prisma.InputJsonValue = {}) {
    return transaction.activityLog.create({ data: { workspaceId, actorId, eventType, subjectType: 'TASK', subjectId: taskId, requestId, metadata: { ...metadata as Record<string, Prisma.JsonValue>, timeEntryId } } });
  }
}
