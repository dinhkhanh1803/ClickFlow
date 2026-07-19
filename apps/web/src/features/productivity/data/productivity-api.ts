import { createApiClient } from '@/lib/api/client';
import { apiBaseUrl } from '@/lib/api/environment';

export type ProjectTemplate = { id: string; name: string; description: string | null; sourceProjectId: string | null; createdAt: string };
export type ArchiveItem = { id: string; name?: string; title?: string; archivedAt: string };
export type ArchiveResponse = { projects: ArchiveItem[]; tasks: ArchiveItem[]; templates: ArchiveItem[] };
export type WorkspaceSettings = { timezone: string; locale: string; preferences: { weekStartsOn?: number; dateFormat?: 'locale' | 'yyyy-MM-dd' | 'dd/MM/yyyy' | 'MM/dd/yyyy'; notifications?: boolean } };

const client = createApiClient(apiBaseUrl);
const auth = (accessToken: string) => ({ accessToken });

export const productivityApi = {
  templates: (token: string, workspaceId: string) => client.get<ProjectTemplate[]>(`/workspaces/${workspaceId}/project-templates`, auth(token)),
  createTemplate: (token: string, workspaceId: string, input: { sourceProjectId: string; name: string; description?: string }) => client.post<ProjectTemplate>(`/workspaces/${workspaceId}/project-templates`, input, auth(token)),
  instantiate: (token: string, workspaceId: string, templateId: string, name?: string) => client.post(`/workspaces/${workspaceId}/project-templates/${templateId}/instantiate`, name ? { name } : {}, { ...auth(token), headers: { 'Idempotency-Key': crypto.randomUUID() } }),
  archiveTemplate: (token: string, workspaceId: string, templateId: string) => client.delete<void>(`/workspaces/${workspaceId}/project-templates/${templateId}`, auth(token)),
  archive: (token: string, workspaceId: string) => client.get<ArchiveResponse>(`/workspaces/${workspaceId}/archive`, auth(token)),
  restore: (token: string, workspaceId: string, type: 'project' | 'task' | 'template', id: string) => client.post<void>(`/workspaces/${workspaceId}/archive/${type}/${id}/restore`, undefined, auth(token)),
  settings: (token: string, workspaceId: string) => client.get<WorkspaceSettings>(`/workspaces/${workspaceId}/settings`, auth(token)),
  updateSettings: (token: string, workspaceId: string, input: Partial<WorkspaceSettings>) => client.patch<WorkspaceSettings>(`/workspaces/${workspaceId}/settings`, input, auth(token)),
};
