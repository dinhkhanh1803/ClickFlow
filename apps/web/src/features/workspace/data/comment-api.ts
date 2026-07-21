import type { ActivityApiResponse, CommentApiResponse, CursorPageResponse } from '@clickflow/contracts';

import { createApiClient } from '@/lib/api/client';
import { apiBaseUrl } from '@/lib/api/environment';

const client = createApiClient(apiBaseUrl);
const authorized = (accessToken: string) => ({ accessToken });

export const commentApi = {
  list(accessToken: string, workspaceId: string, taskId: string): Promise<CursorPageResponse<CommentApiResponse>> {
    return client.get(`/workspaces/${workspaceId}/tasks/${taskId}/comments?limit=100`, authorized(accessToken));
  },
  activity(accessToken: string, workspaceId: string, taskId: string): Promise<CursorPageResponse<ActivityApiResponse>> {
    return client.get(`/workspaces/${workspaceId}/tasks/${taskId}/activity?limit=100`, authorized(accessToken));
  },
  create(accessToken: string, workspaceId: string, taskId: string, body: string): Promise<CommentApiResponse> {
    return client.post(`/workspaces/${workspaceId}/tasks/${taskId}/comments`, { body }, authorized(accessToken));
  },
  update(accessToken: string, workspaceId: string, taskId: string, commentId: string, body: string): Promise<CommentApiResponse> {
    return client.patch(`/workspaces/${workspaceId}/tasks/${taskId}/comments/${commentId}`, { body }, authorized(accessToken));
  },
  remove(accessToken: string, workspaceId: string, taskId: string, commentId: string): Promise<void> {
    return client.delete(`/workspaces/${workspaceId}/tasks/${taskId}/comments/${commentId}`, authorized(accessToken));
  }
};
