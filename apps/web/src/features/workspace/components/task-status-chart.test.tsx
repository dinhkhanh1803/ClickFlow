import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { TaskStatusChart } from '@/features/workspace/components/task-status-chart';

afterEach(cleanup);

describe('TaskStatusChart', () => {
  it('groups scoped local tasks by status for the overview chart', () => {
    render(<TaskStatusChart tasks={[{ id: 'task-1', title: 'Design', status: 'TO DO', priority: 'Normal', assignee: '', startDate: '', dueDate: '', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], attachments: [], createdAt: '2026-07-17T00:00:00.000Z' }, { id: 'task-2', title: 'Build', status: 'IN PROGRESS', priority: 'High', assignee: '', startDate: '', dueDate: '', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], attachments: [], createdAt: '2026-07-17T00:00:00.000Z' }, { id: 'task-3', title: 'Test', status: 'TO DO', priority: 'Low', assignee: '', startDate: '', dueDate: '', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], attachments: [], createdAt: '2026-07-17T00:00:00.000Z' }]} />);

    expect(screen.getByRole('heading', { name: 'Task status' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Task status chart' })).toBeInTheDocument();
    expect(screen.getByText('TO DO')).toBeInTheDocument();
    expect(screen.getByText('2 tasks')).toBeInTheDocument();
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
    expect(screen.getByText('1 task')).toBeInTheDocument();
  });
  it('lists every configured status in the active scope, including statuses with no tasks', () => {
    render(<TaskStatusChart tasks={[{ id: 'task-1', title: 'Plan', status: 'Backlog', priority: 'Normal', assignee: '', startDate: '', dueDate: '', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], attachments: [], createdAt: '2026-07-17T00:00:00.000Z' }]} statusOverrides={[{ status: 'Backlog', name: 'To plan', color: 'violet' }]} statusGroups={[{ id: 'status-done', name: 'Done', scope: 'folder', color: 'emerald', taskStatus: 'status-done-value' }]} />);

    expect(screen.getByText('TO PLAN')).toBeInTheDocument();
    const doneStatus = screen.getByText('DONE');
    expect(doneStatus).toBeInTheDocument();
    expect(doneStatus.closest('li')).toHaveTextContent('0 tasks');
  });
  it('uses API workflow statuses without rendering the local defaults twice', () => {
    render(<TaskStatusChart tasks={[]} statusGroups={[
      { id: 'status-open', name: 'Open', scope: 'folder', color: 'slate', taskStatus: 'Open', source: 'api' },
      { id: 'status-progress', name: 'In progress', scope: 'folder', color: 'blue', taskStatus: 'In progress', source: 'api' },
      { id: 'status-complete', name: 'Complete', scope: 'folder', color: 'emerald', taskStatus: 'Complete', source: 'api' },
    ]} />);

    expect(screen.getAllByText('OPEN')).toHaveLength(1);
    expect(screen.getAllByText('IN PROGRESS')).toHaveLength(1);
    expect(screen.getAllByText('COMPLETE')).toHaveLength(1);
    expect(screen.queryByText('TO DO')).not.toBeInTheDocument();
  });

});
