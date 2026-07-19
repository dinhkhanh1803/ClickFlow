import { describe, expect, it } from 'vitest';
import type { ProjectResponse, SectionResponse, WorkspaceResponse } from '@clickflow/contracts';
import { mapWorkspaceTree } from './workspace-navigation-adapter';

const timestamp = '2026-07-19T00:00:00.000Z';
const workspace = { id: 'workspace-1', name: 'Product', tone: null, private: true, timezone: 'UTC', locale: 'en', role: 'OWNER', createdAt: timestamp, updatedAt: timestamp } satisfies WorkspaceResponse;
const project = { id: 'project-1', workspaceId: workspace.id, name: 'Launch', description: null, tone: null, position: 0, deadline: null, createdAt: timestamp, updatedAt: timestamp, archivedAt: null, health: { totalTasks: 0, completedTasks: 0, overdueTasks: 0, progressPercent: 0, health: 'ON_TRACK' } } satisfies ProjectResponse;
const section = { id: 'section-1', projectId: project.id, name: 'Backlog', position: 0 } satisfies SectionResponse;

describe('mapWorkspaceTree', () => {
  it('maps Workspace, Project and Section to the canonical local navigation tree', () => {
    expect(mapWorkspaceTree([workspace], [project], [section])).toEqual([{
      id: 'workspace-1', name: 'Product', tone: 'bg-indigo-500', private: true,
      items: [
        { id: 'project-1', name: 'Launch', kind: 'folder' },
        { id: 'section-1', name: 'Backlog', kind: 'list', parentId: 'project-1' }
      ]
    }]);
  });
});
