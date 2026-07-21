import type { CurrentTimerApiResponse, TimeEntryApiResponse } from '@clickflow/contracts';

import { createApiClient } from '@/lib/api/client';
import { apiBaseUrl } from '@/lib/api/environment';

export type TimeEntryListResponse = {
  items: TimeEntryApiResponse[];
  page: number;
  pageSize: number;
  total: number;
  totalDurationSeconds: number;
};

const client = createApiClient(apiBaseUrl);
const authorized = (accessToken: string) => ({ accessToken });
const idempotent = (accessToken: string) => ({
  accessToken,
  headers: { 'Idempotency-Key': crypto.randomUUID() }
});

export const timeTrackingApi = {
  current(accessToken: string, workspaceId: string): Promise<CurrentTimerApiResponse> {
    return client.get(`/workspaces/${workspaceId}/timers/current`, authorized(accessToken));
  },
  list(accessToken: string, workspaceId: string): Promise<TimeEntryListResponse> {
    return client.get(`/workspaces/${workspaceId}/time-entries?page=1&pageSize=100`, authorized(accessToken));
  },
  start(accessToken: string, workspaceId: string, taskId: string): Promise<TimeEntryApiResponse> {
    return client.post(`/workspaces/${workspaceId}/timers/start`, { taskId }, idempotent(accessToken));
  },
  stop(accessToken: string, workspaceId: string): Promise<TimeEntryApiResponse> {
    return client.post(`/workspaces/${workspaceId}/timers/stop`, {}, idempotent(accessToken));
  },
  create(accessToken: string, workspaceId: string, input: { taskId: string; startedAt: string; endedAt: string; note?: string | null }): Promise<TimeEntryApiResponse> {
    return client.post(`/workspaces/${workspaceId}/time-entries`, input, authorized(accessToken));
  },
  update(accessToken: string, workspaceId: string, entryId: string, input: { startedAt?: string; endedAt?: string; note?: string | null }): Promise<TimeEntryApiResponse> {
    return client.patch(`/workspaces/${workspaceId}/time-entries/${entryId}`, input, authorized(accessToken));
  },
  archive(accessToken: string, workspaceId: string, entryId: string): Promise<void> {
    return client.delete(`/workspaces/${workspaceId}/time-entries/${entryId}`, authorized(accessToken));
  }
};
