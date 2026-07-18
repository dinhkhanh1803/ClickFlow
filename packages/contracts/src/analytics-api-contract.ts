import { z } from 'zod';

export const analyticsSearchQuerySchema = z.object({
  q: z.string().trim().min(2).max(120),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive().max(100),
  includeArchived: z.boolean().default(false)
});

export const analyticsRangeContract = {
  boundary: '[from,to)',
  aggregationTimezone: 'UTC',
  displayTimezone: 'workspace.timezone'
} as const;

export interface AnalyticsSearchItem {
  id: string;
  type: 'PROJECT' | 'TASK';
  title: string;
  projectId: string | null;
  rank: number;
  updatedAt: string;
}

export interface AnalyticsDashboardContract {
  metrics: { activeProjects: number; dueToday: number; overdueTasks: number; weeklyHours: number };
  projectHealth: Array<{ id: string; name: string; totalTasks: number; completedTasks: number; overdueTasks: number; progressPercent: number; health: 'ON_TRACK' | 'AT_RISK' | 'OVERDUE' | 'COMPLETED' }>;
  upcomingDeadlines: Array<{ id: string; name: string; deadline: string }>;
  timezone: string;
  generatedAt: string;
}
