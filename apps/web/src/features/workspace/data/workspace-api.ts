import type {
  CreateProjectRequest,
  CreateWorkspaceRequest,
  CreateSectionRequest,
  ProjectListResponse,
  ProjectResponse,
  SectionResponse,
  UpdateProjectRequest,
  UpdateSectionRequest,
  WorkspaceResponse
} from '@clickflow/contracts';

import { createApiClient } from '@/lib/api/client';
import { apiBaseUrl } from '@/lib/api/environment';

const client = createApiClient(apiBaseUrl);
const authorized = (accessToken: string) => ({ accessToken });

export const workspaceApi = {
  createWorkspace(accessToken: string, input: CreateWorkspaceRequest): Promise<WorkspaceResponse> {
    return client.post('/workspaces', input, authorized(accessToken));
  },
  listWorkspaces(accessToken: string): Promise<WorkspaceResponse[]> {
    return client.get('/workspaces', authorized(accessToken));
  },
  listProjects(accessToken: string, workspaceId: string): Promise<ProjectListResponse> {
    return client.get(`/workspaces/${workspaceId}/projects?page=1&pageSize=100&sortBy=updatedAt&sortOrder=desc`, authorized(accessToken));
  },
  createProject(accessToken: string, workspaceId: string, input: CreateProjectRequest): Promise<ProjectResponse> {
    return client.post(`/workspaces/${workspaceId}/projects`, input, authorized(accessToken));
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
