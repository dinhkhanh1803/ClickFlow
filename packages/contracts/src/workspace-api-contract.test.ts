import { describe, expect, it } from 'vitest';
import type { CreateWorkspaceRequest, ProjectResponse, SectionResponse, WorkspaceResponse } from './workspace-api-contract';

describe('workspace API contracts', () => {
  it('represent the frontend Space, Folder and List mapping without duplicate entities', () => {
    const createWorkspace = { name: 'Product', description: 'Product planning Space', private: false, publicAccess: 'VIEW', timezone: 'UTC', locale: 'en' } satisfies CreateWorkspaceRequest;
    const workspace = { id: 'workspace-1', name: 'Product', description: 'Product planning Space', tone: null, private: false, publicAccess: 'VIEW', timezone: 'UTC', locale: 'en', role: 'OWNER', createdBy: { id: 'user-1', displayName: 'Owner User', avatarUrl: null }, createdAt: '2026-07-19T00:00:00.000Z', updatedAt: '2026-07-19T00:00:00.000Z' } satisfies WorkspaceResponse;
    const project = { id: 'project-1', workspaceId: workspace.id, name: 'Launch', description: null, tone: null, position: 0, deadline: null, createdAt: workspace.createdAt, updatedAt: workspace.updatedAt, archivedAt: null, health: { totalTasks: 0, completedTasks: 0, overdueTasks: 0, progressPercent: 0, health: 'ON_TRACK' } } satisfies ProjectResponse;
    const section = { id: 'section-1', projectId: project.id, name: 'Backlog', position: 0 } satisfies SectionResponse;

    expect([createWorkspace.name, workspace.id, workspace.publicAccess, workspace.createdBy.displayName, project.workspaceId, section.projectId]).toEqual(['Product', 'workspace-1', 'VIEW', 'Owner User', 'workspace-1', 'project-1']);
  });
});
