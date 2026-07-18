import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, WorkspaceRole } from '@prisma/client';

import type { AuthClientContext } from '../auth/auth.service';
import { PrismaService } from '../database/prisma.service';
import { assertCanDeleteComment, assertCanUpdateComment } from './comment-policy';
import type { CreateCommentInput, CursorPageInput, UpdateCommentInput } from './comment.schemas';

const userSummary = { id: true, displayName: true, avatarUrl: true } as const;
const commentSelect = {
  id: true,
  taskId: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  author: { select: userSummary }
} as const;
const activitySelect = {
  id: true,
  eventType: true,
  subjectType: true,
  subjectId: true,
  metadata: true,
  createdAt: true,
  actor: { select: userSummary }
} as const;

function initials(displayName: string): string {
  return displayName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
}

function summarize<User extends { displayName: string }>(user: User): User & { initials: string } {
  return { ...user, initials: initials(user.displayName) };
}

@Injectable()
export class CommentService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(workspaceId: string, taskId: string, query: CursorPageInput) {
    await this.assertTask(workspaceId, taskId, false);
    if (query.cursor) await this.assertCommentCursor(workspaceId, taskId, query.cursor);
    const comments = await this.prisma.comment.findMany({
      where: { workspaceId, taskId, deletedAt: null },
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      take: query.limit + 1,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: commentSelect
    });
    const hasMore = comments.length > query.limit;
    const items = comments.slice(0, query.limit).map(({ author, ...comment }) => ({ ...comment, author: summarize(author) }));
    return { items, nextCursor: hasMore ? items.at(-1)?.id ?? null : null };
  }

  async create(workspaceId: string, taskId: string, actorId: string, input: CreateCommentInput, context: AuthClientContext) {
    await this.assertTask(workspaceId, taskId, true);
    const comment = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.comment.create({ data: { workspaceId, taskId, authorId: actorId, body: input.body }, select: commentSelect });
      await this.recordActivity(transaction, workspaceId, actorId, 'COMMENT_CREATED', taskId, created.id, context.requestId);
      return created;
    });
    const { author, ...fields } = comment;
    return { ...fields, author: summarize(author) };
  }

  async update(workspaceId: string, taskId: string, commentId: string, actorId: string, input: UpdateCommentInput, context: AuthClientContext) {
    await this.assertTask(workspaceId, taskId, true);
    const existing = await this.prisma.comment.findFirst({ where: { id: commentId, workspaceId, taskId, deletedAt: null }, select: { id: true, authorId: true } });
    if (!existing) throw new NotFoundException('Comment not found');
    assertCanUpdateComment(actorId, existing.authorId);
    const comment = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.comment.updateMany({ where: { id: commentId, workspaceId, taskId, authorId: actorId, deletedAt: null }, data: { body: input.body } });
      if (updated.count !== 1) throw new NotFoundException('Comment not found');
      await this.recordActivity(transaction, workspaceId, actorId, 'COMMENT_UPDATED', taskId, commentId, context.requestId);
      return transaction.comment.findUniqueOrThrow({ where: { id: commentId }, select: commentSelect });
    });
    const { author, ...fields } = comment;
    return { ...fields, author: summarize(author) };
  }

  async remove(workspaceId: string, taskId: string, commentId: string, actorId: string, context: AuthClientContext): Promise<void> {
    await this.assertTask(workspaceId, taskId, true);
    const [comment, membership] = await Promise.all([
      this.prisma.comment.findFirst({ where: { id: commentId, workspaceId, taskId, deletedAt: null }, select: { id: true, authorId: true } }),
      this.prisma.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId, userId: actorId } }, select: { role: true } })
    ]);
    if (!comment) throw new NotFoundException('Comment not found');
    assertCanDeleteComment(actorId, comment.authorId, membership?.role ?? WorkspaceRole.MEMBER);
    await this.prisma.$transaction(async (transaction) => {
      const deleted = await transaction.comment.updateMany({ where: { id: commentId, workspaceId, taskId, deletedAt: null }, data: { deletedAt: new Date() } });
      if (deleted.count !== 1) throw new NotFoundException('Comment not found');
      await this.recordActivity(transaction, workspaceId, actorId, 'COMMENT_DELETED', taskId, commentId, context.requestId);
    });
  }

  async activity(workspaceId: string, taskId: string, query: CursorPageInput) {
    await this.assertTask(workspaceId, taskId, false);
    if (query.cursor) await this.assertActivityCursor(workspaceId, taskId, query.cursor);
    const activities = await this.prisma.activityLog.findMany({
      where: { workspaceId, subjectType: 'TASK', subjectId: taskId },
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      take: query.limit + 1,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: activitySelect
    });
    const hasMore = activities.length > query.limit;
    const items = activities.slice(0, query.limit).map(({ actor, ...activity }) => ({ ...activity, actor: actor ? summarize(actor) : null }));
    return { items, nextCursor: hasMore ? items.at(-1)?.id ?? null : null };
  }

  private async assertTask(workspaceId: string, taskId: string, activeOnly: boolean): Promise<void> {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, workspaceId, archivedAt: activeOnly ? null : undefined }, select: { id: true } });
    if (!task) throw new NotFoundException(activeOnly ? 'Active task not found' : 'Task not found');
  }

  private async assertCommentCursor(workspaceId: string, taskId: string, cursor: string): Promise<void> {
    const exists = await this.prisma.comment.count({ where: { id: cursor, workspaceId, taskId, deletedAt: null } });
    if (!exists) throw new BadRequestException('Invalid comment cursor');
  }

  private async assertActivityCursor(workspaceId: string, taskId: string, cursor: string): Promise<void> {
    const exists = await this.prisma.activityLog.count({ where: { id: cursor, workspaceId, subjectType: 'TASK', subjectId: taskId } });
    if (!exists) throw new BadRequestException('Invalid activity cursor');
  }

  private recordActivity(transaction: Prisma.TransactionClient, workspaceId: string, actorId: string, eventType: string, taskId: string, commentId: string, requestId?: string) {
    return transaction.activityLog.create({ data: { workspaceId, actorId, eventType, subjectType: 'TASK', subjectId: taskId, requestId, metadata: { commentId } } });
  }
}
