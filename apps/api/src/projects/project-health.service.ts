import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { calculateProjectHealth, type ProjectHealthResult } from './project-health';

@Injectable()
export class ProjectHealthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getForProject(workspaceId: string, projectId: string, deadline: Date | null, now = new Date()): Promise<ProjectHealthResult & {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
  }> {
    const base = { workspaceId, projectId, archivedAt: null } as const;
    const [totalTasks, completedTasks, overdueTasks] = await this.prisma.$transaction([
      this.prisma.task.count({ where: base }),
      this.prisma.task.count({ where: { ...base, OR: [{ completedAt: { not: null } }, { status: { completed: true } }] } }),
      this.prisma.task.count({
        where: { ...base, dueAt: { lt: now }, completedAt: null, status: { completed: false } }
      })
    ]);
    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      ...calculateProjectHealth({ totalTasks, completedTasks, overdueTasks, deadline }, now)
    };
  }
}
