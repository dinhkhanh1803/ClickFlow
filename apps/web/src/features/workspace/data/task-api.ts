import type { TaskApiResponse, TaskCreateRequest, TaskListResponse, TaskUpdateRequest } from '@clickflow/contracts';

import { createApiClient } from '@/lib/api/client';
import { apiBaseUrl } from '@/lib/api/environment';

const client = createApiClient(apiBaseUrl);
const authorized = (accessToken: string) => ({ accessToken });

export const taskApi = {
  list(accessToken: string, workspaceId: string, projectId: string): Promise<TaskListResponse> {
    return client.get(`/workspaces/${workspaceId}/tasks?page=1&pageSize=100&projectId=${projectId}`, authorized(accessToken));
  },
  create(accessToken: string, workspaceId: string, input: TaskCreateRequest): Promise<TaskApiResponse> {
    return client.post(`/workspaces/${workspaceId}/tasks`, input, authorized(accessToken));
  },
  update(accessToken: string, workspaceId: string, taskId: string, input: TaskUpdateRequest): Promise<TaskApiResponse> {
    return client.patch(`/workspaces/${workspaceId}/tasks/${taskId}`, input, authorized(accessToken));
  },
  archive(accessToken: string, workspaceId: string, taskId: string, version: number): Promise<void> {
    return client.delete(`/workspaces/${workspaceId}/tasks/${taskId}?version=${version}`, authorized(accessToken));
  }
};
