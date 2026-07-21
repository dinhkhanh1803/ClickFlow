import { describe, expect, it } from 'vitest';
import type { LocalSpace } from '@/features/workspace/model/local-navigation';
import { searchLocalWorkspace } from './local-workspace-search';

const spaces: LocalSpace[] = [{
  id: 'space-1', name: 'Product', tone: 'bg-indigo-500', items: [
    { id: 'folder-1', name: 'Launch', kind: 'folder' },
    { id: 'list-1', name: 'Release', kind: 'list', parentId: 'folder-1', tasks: [{ id: 'task-1', title: 'Launch release', status: 'To do', priority: 'Normal', assignee: '', startDate: '', dueDate: '', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], attachments: [], createdAt: '2026-07-17T00:00:00.000Z' }] },
    { id: 'doc-1', name: 'Launch brief', kind: 'doc', parentId: 'folder-1' },
  ],
}];

describe('searchLocalWorkspace', () => {
  it('finds local task, doc, and their navigable workspace context', () => {
    const results = searchLocalWorkspace(spaces, 'launch');

    expect(results).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'folder', label: 'Launch', href: '/projects?space=space-1&folder=folder-1' }),
      expect.objectContaining({ kind: 'task', label: 'Launch release', href: '/projects?space=space-1&folder=folder-1&list=list-1' }),
      expect.objectContaining({ kind: 'doc', label: 'Launch brief', href: '/projects?space=space-1&folder=folder-1&doc=doc-1' }),
    ]));
  });
});