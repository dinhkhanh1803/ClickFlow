import type {
  CreateProjectRequest,
  CreateProjectStatusRequest,
  CreateWorkspaceRequest,
  CreateSectionRequest,
  ProjectListResponse,
  ProjectResponse,
  ProjectStatusResponse,
  SectionResponse,
  UpdateProjectStatusRequest,
  UpdateWorkspaceRequest,
  UpdateProjectRequest,
  UpdateSectionRequest,
  WorkspaceResponse,
  ArchivedWorkspaceResponse,
  AssignableUserResponse,
  InviteWorkspaceMemberRequest,
  TaskTagResponse,
  WorkspaceMemberResponse
} from '@clickflow/contracts';

import { createApiClient } from '@/lib/api/client';
import { apiBaseUrl } from '@/lib/api/environment';

const client = createApiClient(apiBaseUrl);
const authorized = (accessToken: string) => ({ accessToken });

export const workspaceApi = {
  createWorkspace(accessToken: string, input: CreateWorkspaceRequest): Promise<WorkspaceResponse> {
    return client.post('/workspaces', input, authorized(accessToken));
  },
  updateWorkspace(accessToken: string, workspaceId: string, input: UpdateWorkspaceRequest): Promise<WorkspaceResponse> {
    return client.patch('/workspaces/' + workspaceId, input, authorized(accessToken));
  },
  archiveWorkspace(accessToken: string, workspaceId: string): Promise<void> {
    return client.delete('/workspaces/' + workspaceId, authorized(accessToken));
  },
  listArchivedWorkspaces(accessToken: string): Promise<ArchivedWorkspaceResponse[]> {
    return client.get('/workspaces/archived', authorized(accessToken));
  },
  restoreWorkspace(accessToken: string, workspaceId: string): Promise<WorkspaceResponse> {
    return client.post('/workspaces/' + workspaceId + '/restore', {}, authorized(accessToken));
  },
  duplicateWorkspace(accessToken: string, workspaceId: string): Promise<WorkspaceResponse> {
    return client.post('/workspaces/' + workspaceId + '/duplicate', {}, authorized(accessToken));
  },
  listWorkspaces(accessToken: string): Promise<WorkspaceResponse[]> {
    return client.get('/workspaces', authorized(accessToken));
  },
  listMembers(accessToken: string, workspaceId: string): Promise<WorkspaceMemberResponse[]> {
    return client.get('/workspaces/' + workspaceId + '/members', authorized(accessToken));
  },
  inviteMember(accessToken: string, workspaceId: string, input: InviteWorkspaceMemberRequest): Promise<WorkspaceMemberResponse> {
    return client.post('/workspaces/' + workspaceId + '/members', input, authorized(accessToken));
  },
  listAssignableUsers(accessToken: string, query?: string): Promise<AssignableUserResponse[]> {
    const search = query?.trim();
    return client.get('/users/assignable' + (search ? '?q=' + encodeURIComponent(search) : ''), authorized(accessToken));
  },
  listProjects(accessToken: string, workspaceId: string): Promise<ProjectListResponse> {
    return client.get(`/workspaces/${workspaceId}/projects?page=1&pageSize=100&sortBy=updatedAt&sortOrder=desc`, authorized(accessToken));
  },
  createProject(accessToken: string, workspaceId: string, input: CreateProjectRequest): Promise<ProjectResponse> {
    return client.post(`/workspaces/${workspaceId}/projects`, input, authorized(accessToken));
  },
  listTags(accessToken: string, workspaceId: string): Promise<TaskTagResponse[]> {
    return client.get(`/workspaces/${workspaceId}/tags`, authorized(accessToken));
  },
  createTag(accessToken: string, workspaceId: string, input: { name: string; color: string }): Promise<TaskTagResponse> {
    return client.post(`/workspaces/${workspaceId}/tags`, input, authorized(accessToken));
  },
  attachTag(accessToken: string, workspaceId: string, taskId: string, tagId: string): Promise<void> {
    return client.post(`/workspaces/${workspaceId}/tasks/${taskId}/tags`, { tagId }, authorized(accessToken));
  },
  detachTag(accessToken: string, workspaceId: string, taskId: string, tagId: string): Promise<void> {
    return client.delete(`/workspaces/${workspaceId}/tasks/${taskId}/tags/${tagId}`, authorized(accessToken));
  },
  updateProject(accessToken: string, workspaceId: string, projectId: string, input: UpdateProjectRequest): Promise<ProjectResponse> {
    return client.patch(`/workspaces/${workspaceId}/projects/${projectId}`, input, authorized(accessToken));
  },
  archiveProject(accessToken: string, workspaceId: string, projectId: string): Promise<void> {
    return client.delete(`/workspaces/${workspaceId}/projects/${projectId}`, authorized(accessToken));
  },
  listSections(accessToken: string, workspaceId: string, projectId: string): Promise<SectionResponse[]> {
    return client.get(`/workspaces/${workspaceId}/projects/${projectId}/sections`, authorized(accessToken));
  },
  listStatuses(accessToken: string, workspaceId: string, projectId: string): Promise<ProjectStatusResponse[]> {
    return client.get(`/workspaces/${workspaceId}/projects/${projectId}/statuses`, authorized(accessToken));
  },
  createStatus(accessToken: string, workspaceId: string, projectId: string, input: CreateProjectStatusRequest): Promise<ProjectStatusResponse> {
    return client.post(`/workspaces/${workspaceId}/projects/${projectId}/statuses`, input, authorized(accessToken));
  },
  updateStatus(accessToken: string, workspaceId: string, projectId: string, statusId: string, input: UpdateProjectStatusRequest): Promise<ProjectStatusResponse> {
    return client.patch(`/workspaces/${workspaceId}/projects/${projectId}/statuses/${statusId}`, input, authorized(accessToken));
  },
  deleteStatus(accessToken: string, workspaceId: string, projectId: string, statusId: string, replacementStatusId?: string): Promise<void> {
    return client.delete(`/workspaces/${workspaceId}/projects/${projectId}/statuses/${statusId}`, { ...authorized(accessToken), body: replacementStatusId ? { replacementStatusId } : {} });
  },
  createSection(accessToken: string, workspaceId: string, projectId: string, input: CreateSectionRequest): Promise<SectionResponse> {
    return client.post(`/workspaces/${workspaceId}/projects/${projectId}/sections`, input, authorized(accessToken));
  },
  updateSection(accessToken: string, workspaceId: string, projectId: string, sectionId: string, input: UpdateSectionRequest): Promise<SectionResponse> {
    return client.patch(`/workspaces/${workspaceId}/projects/${projectId}/sections/${sectionId}`, input, authorized(accessToken));
  },
  archiveSection(accessToken: string, workspaceId: string, projectId: string, sectionId: string): Promise<void> {
    return client.delete(`/workspaces/${workspaceId}/projects/${projectId}/sections/${sectionId}`, authorized(accessToken));
  }
};



