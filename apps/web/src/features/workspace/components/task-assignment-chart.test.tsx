import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskAssignmentChart } from '@/features/workspace/components/task-assignment-chart';

const task = (id: string, assignee: string) => ({ id, title: id, status: 'Backlog', priority: 'Normal' as const, assignee, startDate: '', dueDate: '', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], attachments: [], createdAt: '2026-07-17T00:00:00.000Z' });

describe('TaskAssignmentChart', () => {
  it('summarizes assigned and unassigned tasks in the active Space or Folder scope', () => {
    render(<TaskAssignmentChart tasks={[task('assigned', 'Khanh Tran'), task('unassigned', ''), task('blank', '   ')]} />);

    expect(screen.getByRole('heading', { name: 'Task assignment' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Task assignment chart' })).toBeInTheDocument();
    expect(screen.getByText('Assigned').closest('li')).toHaveTextContent('1 task');
    expect(screen.getByText('Unassigned').closest('li')).toHaveTextContent('2 tasks');
  });
});