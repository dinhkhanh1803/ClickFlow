import { describe, expect, it } from 'vitest';
import { deriveLocalDashboard } from '@/features/dashboard/data/local-dashboard';
import type { LocalSpace } from '@/features/workspace/model/local-navigation';

const spaces: LocalSpace[] = [{
  id: 'space-product', name: 'Product', tone: 'bg-indigo-500', items: [
    { id: 'folder-launch', name: 'Launch', kind: 'folder' },
    { id: 'list-web', name: 'Web', kind: 'list', parentId: 'folder-launch', tasks: [
      { id: 'task-today', title: 'Ship dashboard', status: 'TO DO', priority: 'High', assignee: 'Khanh', startDate: '', dueDate: '2026-07-17', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], attachments: [], createdAt: '2026-07-17T08:00:00.000Z' },
      { id: 'task-overdue', title: 'Fix navigation', status: 'IN PROGRESS', priority: 'Normal', assignee: '', startDate: '', dueDate: '2026-07-15', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], attachments: [], createdAt: '2026-07-15T08:00:00.000Z' },
      { id: 'task-done', title: 'Draft brief', status: 'COMPLETE', priority: 'Low', assignee: '', startDate: '', dueDate: '2026-07-18', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], attachments: [], createdAt: '2026-07-14T08:00:00.000Z' },
      { id: 'task-later', title: 'Prepare release notes', status: 'TO DO', priority: 'Normal', assignee: '', startDate: '', dueDate: '2026-07-19', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], attachments: [], createdAt: '2026-07-17T08:00:00.000Z' },
    ] },
  ],
}];

describe('deriveLocalDashboard', () => {
  it('derives dashboard metrics and visible content from saved workspace tasks', () => {
    const dashboard = deriveLocalDashboard(spaces, new Date('2026-07-17T09:00:00.000Z'));

    expect(dashboard.metrics).toEqual([
      { label: 'Spaces', value: '1' },
      { label: 'Lists', value: '1' },
      { label: 'Open tasks', value: '3' },
      { label: 'Overdue tasks', value: '1' },
    ]);
    expect(dashboard.dueToday.map((task) => task.title)).toEqual(['Ship dashboard']);
    expect(dashboard.assignedToMe.map((task) => task.title)).toEqual(['Ship dashboard']);
    expect(dashboard.folderProgress).toEqual([{ id: 'folder-launch', name: 'Launch', completed: 1, total: 4, progress: 25 }]);
    expect(dashboard.upcomingDeadlines.map((task) => task.title)).toEqual(['Ship dashboard', 'Prepare release notes']);
  });
});
