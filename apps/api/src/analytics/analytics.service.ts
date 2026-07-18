import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { calculateProjectHealth } from '../projects/project-health';
import { searchRank, utcDayBounds, utcDayKey } from './analytics-rules';
import type { ReportInput, SearchInput } from './analytics.schemas';

@Injectable()
export class AnalyticsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async dashboard(workspaceId: string) {
    const generatedAt = new Date();
    const today = utcDayBounds(generatedAt);
    const weekFrom = new Date(generatedAt.getTime() - 7 * 86_400_000);
    const [workspace, projects, weekly] = await this.prisma.$transaction([
      this.prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { timezone: true } }),
      this.prisma.project.findMany({
        where: { workspaceId, archivedAt: null }, orderBy: [{ deadline: 'asc' }, { id: 'asc' }],
        select: { id: true, name: true, deadline: true, tasks: { where: { archivedAt: null }, select: { dueAt: true, completedAt: true, status: { select: { completed: true } } } } }
      }),
      this.prisma.timeEntry.aggregate({ where: { workspaceId, archivedAt: null, endedAt: { not: null, gt: weekFrom, lte: generatedAt } }, _sum: { durationSeconds: true } })
    ]);
    let dueToday = 0;
    let overdueTasks = 0;
    const projectHealth = projects.map((project) => {
      const completedTasks = project.tasks.filter((task) => task.completedAt || task.status.completed).length;
      const overdue = project.tasks.filter((task) => !task.completedAt && !task.status.completed && task.dueAt && task.dueAt < generatedAt).length;
      dueToday += project.tasks.filter((task) => !task.completedAt && task.dueAt && task.dueAt >= today.from && task.dueAt < today.to).length;
      overdueTasks += overdue;
      return { id: project.id, name: project.name, totalTasks: project.tasks.length, completedTasks, overdueTasks: overdue, ...calculateProjectHealth({ totalTasks: project.tasks.length, completedTasks, overdueTasks: overdue, deadline: project.deadline }, generatedAt) };
    });
    return {
      metrics: { activeProjects: projects.length, dueToday, overdueTasks, weeklyHours: Math.round(((weekly._sum.durationSeconds ?? 0) / 3600) * 100) / 100 },
      projectHealth,
      upcomingDeadlines: projects.filter((project) => project.deadline && project.deadline >= generatedAt).slice(0, 10).map(({ id, name, deadline }) => ({ id, name, deadline })),
      timezone: workspace.timezone, generatedAt
    };
  }

  async search(workspaceId: string, query: SearchInput) {
    const archivedAt = query.includeArchived ? undefined : null;
    const [projects, tasks] = await this.prisma.$transaction([
      this.prisma.project.findMany({ where: { workspaceId, archivedAt, name: { contains: query.q, mode: 'insensitive' } }, select: { id: true, name: true, updatedAt: true } }),
      this.prisma.task.findMany({ where: { workspaceId, archivedAt, title: { contains: query.q, mode: 'insensitive' } }, select: { id: true, title: true, projectId: true, updatedAt: true } })
    ]);
    const items = [
      ...projects.map((item) => ({ id: item.id, type: 'PROJECT' as const, title: item.name, projectId: null, rank: searchRank(item.name, query.q), updatedAt: item.updatedAt })),
      ...tasks.map((item) => ({ id: item.id, type: 'TASK' as const, title: item.title, projectId: item.projectId, rank: searchRank(item.title, query.q), updatedAt: item.updatedAt }))
    ].sort((a, b) => b.rank - a.rank || b.updatedAt.getTime() - a.updatedAt.getTime() || a.id.localeCompare(b.id));
    const offset = (query.page - 1) * query.pageSize;
    return { items: items.slice(offset, offset + query.pageSize), page: query.page, pageSize: query.pageSize, total: items.length };
  }

  async timeReport(workspaceId: string, query: ReportInput) {
    const entries = await this.prisma.timeEntry.findMany({
      where: { workspaceId, archivedAt: null, endedAt: { not: null, gt: query.from }, startedAt: { lt: query.to }, task: query.projectId ? { projectId: query.projectId } : undefined },
      select: { startedAt: true, durationSeconds: true, task: { select: { project: { select: { id: true, name: true } } } } }
    });
    const projects = new Map<string, { projectId: string; projectName: string; seconds: number }>();
    const days = new Map<string, number>();
    for (const entry of entries) {
      const project = entry.task.project;
      const current = projects.get(project.id) ?? { projectId: project.id, projectName: project.name, seconds: 0 };
      current.seconds += entry.durationSeconds ?? 0;
      projects.set(project.id, current);
      const day = utcDayKey(entry.startedAt);
      days.set(day, (days.get(day) ?? 0) + (entry.durationSeconds ?? 0));
    }
    const totalSeconds = entries.reduce((sum, item) => sum + (item.durationSeconds ?? 0), 0);
    return { totalSeconds, totalHours: Math.round((totalSeconds / 3600) * 100) / 100, byProject: [...projects.values()], byDay: [...days].sort().map(([date, seconds]) => ({ date, seconds })), boundary: '[from,to)', timezone: 'UTC' };
  }

  async progressReport(workspaceId: string, query: ReportInput) {
    const tasks = await this.prisma.task.findMany({ where: { workspaceId, archivedAt: null, updatedAt: { gte: query.from, lt: query.to }, projectId: query.projectId }, select: { completedAt: true, status: { select: { completed: true } }, project: { select: { id: true, name: true } } } });
    const projects = new Map<string, { projectId: string; projectName: string; totalTasks: number; completedTasks: number }>();
    for (const task of tasks) {
      const current = projects.get(task.project.id) ?? { projectId: task.project.id, projectName: task.project.name, totalTasks: 0, completedTasks: 0 };
      current.totalTasks++;
      if (task.completedAt || task.status.completed) current.completedTasks++;
      projects.set(task.project.id, current);
    }
    const completedTasks = [...projects.values()].reduce((sum, item) => sum + item.completedTasks, 0);
    return { totalTasks: tasks.length, completedTasks, completionPercent: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0, byProject: [...projects.values()], boundary: '[from,to)', timezone: 'UTC' };
  }
}
