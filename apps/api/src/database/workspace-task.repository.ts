import { Inject, Injectable } from '@nestjs/common';
import type { Task } from '@prisma/client';

import { PrismaService } from './prisma.service';

@Injectable()
export class WorkspaceTaskRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findById(workspaceId: string, taskId: string): Promise<Task | null> {
    return this.prisma.task.findFirst({ where: { id: taskId, workspaceId, archivedAt: null } });
  }

  async rename(workspaceId: string, taskId: string, title: string): Promise<Task | null> {
    const result = await this.prisma.task.updateMany({
      where: { id: taskId, workspaceId, archivedAt: null },
      data: { title, version: { increment: 1 } }
    });
    return result.count === 1 ? this.findById(workspaceId, taskId) : null;
  }
}
