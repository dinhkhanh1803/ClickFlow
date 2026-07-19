import { describe, expect, it } from 'vitest';
import { SPACE_ROOT_PROJECT_TONE, type DocumentResponse, type ProjectResponse, type ProjectStatusResponse, type SectionResponse, type TaskApiResponse, type WorkspaceResponse } from '@clickflow/contracts';
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
        { id: 'project-1', name: 'Launch', kind: 'folder', statusGroups: [] },
        { id: 'section-1', name: 'Backlog', kind: 'list', apiProjectId: 'project-1', parentId: 'project-1', tasks: [] }
      ]
    }]);
  });

  it('maps API statuses and tasks into the selected List', () => {
    const status = { id: 'status-1', projectId: project.id, name: 'In progress', color: '#3b82f6', category: 'IN_PROGRESS', completed: false, isSystem: true, position: 0 } satisfies ProjectStatusResponse;
    const task = { id: 'task-1', workspaceId: workspace.id, projectId: project.id, sectionId: section.id, statusId: status.id, assigneeId: null, parentTaskId: null, title: 'Connect tasks', description: 'Use the API', priority: 'HIGH', position: 0, dueAt: '2026-07-20T00:00:00.000Z', completedAt: null, version: 2, archivedAt: null, createdAt: timestamp, updatedAt: timestamp } satisfies TaskApiResponse;

    const tree = mapWorkspaceTree([workspace], [project], [section], [status], [task]);

    expect(tree[0].items[0]).toMatchObject({
      statusGroups: [{ id: 'status-1', name: 'In progress', source: 'api', color: 'blue' }]
    });
    expect(tree[0].items[1]).toMatchObject({
      tasks: [{ id: 'task-1', version: 2, title: 'Connect tasks', statusGroupId: 'status-1', priority: 'High', dueDate: '2026-07-20' }]
    });
  });

  it('preserves saved status colors and applies the three default status colors', () => {
    const statuses = [
      { id: 'status-open', projectId: project.id, name: 'Open', color: '#64748b', category: 'OPEN', completed: false, isSystem: true, position: 0 },
      { id: 'status-progress', projectId: project.id, name: 'In progress', color: '#3b82f6', category: 'IN_PROGRESS', completed: false, isSystem: true, position: 1 },
      { id: 'status-complete', projectId: project.id, name: 'Complete', color: '#10b981', category: 'COMPLETED', completed: true, isSystem: true, position: 2 },
      { id: 'status-custom', projectId: project.id, name: 'Blocked', color: '#f43f5e', category: 'OPEN', completed: false, isSystem: false, position: 3 },
    ] satisfies ProjectStatusResponse[];

    const tree = mapWorkspaceTree([workspace], [project], [section], statuses);
    const folder = tree[0].items.find((item) => item.id === project.id);

    expect(folder?.statusGroups).toMatchObject([
      { name: 'Open', color: 'slate' },
      { name: 'In progress', color: 'blue' },
      { name: 'Complete', color: 'emerald' },
      { name: 'Blocked', color: 'rose' },
    ]);
  });
  it('maps Lists from the hidden Space container directly under the Workspace', () => {
    const rootProject = { ...project, id: 'project-root', name: 'Space Lists', tone: SPACE_ROOT_PROJECT_TONE, position: 1 };
    const rootSection = { id: 'section-root', projectId: rootProject.id, name: 'Inbox', position: 0 } satisfies SectionResponse;
    const rootStatus = { id: 'status-open', projectId: rootProject.id, name: 'Open', color: '#64748b', category: 'OPEN', completed: false, isSystem: true, position: 0 } satisfies ProjectStatusResponse;

    const tree = mapWorkspaceTree([workspace], [project, rootProject], [section, rootSection], [rootStatus]);
    const rootList = tree[0].items.find((item) => item.id === rootSection.id);

    expect(tree[0].items.some((item) => item.id === rootProject.id)).toBe(false);
    expect(rootList).toMatchObject({
      id: 'section-root', name: 'Inbox', kind: 'list', apiProjectId: 'project-root',
      statusGroups: [{ id: 'status-open', name: 'Open', source: 'api' }]
    });
    expect(rootList).not.toHaveProperty('parentId');

  });
  it('places persisted Documents at Workspace and Folder scope', () => {
    const folderDoc = { id: 'doc-folder', workspaceId: workspace.id, projectId: project.id, sectionId: null, title: 'Launch brief', content: '<p>Ready</p>', contentVersion: 3, createdAt: timestamp, updatedAt: timestamp, archivedAt: null } satisfies DocumentResponse;
    const workspaceDoc = { ...folderDoc, id: 'doc-space', projectId: null, title: 'Workspace notes', contentVersion: 1 } satisfies DocumentResponse;

    const tree = mapWorkspaceTree([workspace], [project], [section], [], [], [], [], [], [folderDoc, workspaceDoc]);

    expect(tree[0].items.find((item) => item.id === folderDoc.id)).toMatchObject({
      kind: 'doc',
      parentId: project.id,
      document: { content: '<p>Ready</p>', contentVersion: 3, updatedAt: timestamp }
    });
    expect(tree[0].items.find((item) => item.id === workspaceDoc.id)).toMatchObject({
      kind: 'doc',
      name: 'Workspace notes',
      document: { contentVersion: 1 }
    });
    expect(tree[0].items.find((item) => item.id === workspaceDoc.id)).not.toHaveProperty('parentId');
  });
});
