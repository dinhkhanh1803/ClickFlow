import type { AnalyticsDashboardContract, AnalyticsSearchItem } from '@clickflow/contracts';

import { createApiClient } from '@/lib/api/client';
import { apiBaseUrl } from '@/lib/api/environment';

export type AnalyticsSearchResponse = { items: AnalyticsSearchItem[]; page: number; pageSize: number; total: number };
export type TimeReportResponse = {
  totalSeconds: number;
  totalHours: number;
  byProject: Array<{ projectId: string; projectName: string; seconds: number }>;
  byDay: Array<{ date: string; seconds: number }>;
};
export type ProgressReportResponse = {
  totalTasks: number;
  completedTasks: number;
  completionPercent: number;
  byProject: Array<{ projectId: string; projectName: string; totalTasks: number; completedTasks: number }>;
};

const client = createApiClient(apiBaseUrl);
const authorized = (accessToken: string) => ({ accessToken });

export const analyticsApi = {
  dashboard(accessToken: string, workspaceId: string): Promise<AnalyticsDashboardContract> {
    return client.get(`/workspaces/${workspaceId}/dashboard`, authorized(accessToken));
  },
  search(accessToken: string, workspaceId: string, query: string): Promise<AnalyticsSearchResponse> {
    return client.get(`/workspaces/${workspaceId}/search?q=${encodeURIComponent(query)}&page=1&pageSize=50`, authorized(accessToken));
  },
  timeReport(accessToken: string, workspaceId: string, from: string, to: string): Promise<TimeReportResponse> {
    return client.get(`/workspaces/${workspaceId}/reports/time?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, authorized(accessToken));
  },
  progressReport(accessToken: string, workspaceId: string, from: string, to: string): Promise<ProgressReportResponse> {
    return client.get(`/workspaces/${workspaceId}/reports/progress?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, authorized(accessToken));
  }
};
