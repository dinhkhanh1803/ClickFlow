import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/features/auth/model/auth-store';
import type { LocalListTask, LocalStatusGroup } from '../model/local-navigation';
import { AssigneePicker, buildLocalTaskStatusOptions, formatSystemActivityMessage, LocalListTaskSurface, StatusPicker } from './local-list-task-surface';

const task = (id: string, title: string, statusGroupId: string, assigneeId: string): LocalListTask => ({
  id, title, status: statusGroupId, statusGroupId, assigneeId, assignee: 'Assigned', priority: 'Normal', startDate: '', dueDate: '', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], attachments: [], createdAt: '2026-07-19T00:00:00.000Z'
});

const groups: LocalStatusGroup[] = [
  { id: 'complete', name: 'Complete', taskStatus: 'Complete', scope: 'list', color: 'emerald', source: 'api', isSystem: true },
  { id: 'done-custom', name: 'Done', taskStatus: 'Done', scope: 'list', color: 'slate', source: 'api' },
  { id: 'open', name: 'Open', taskStatus: 'Open', scope: 'list', color: 'slate', source: 'api', isSystem: true },
];

const callbacks = {
  onCreateStatus: vi.fn(), onDeleteStatus: vi.fn(), onUpdateStatus: vi.fn(), onCreateTask: vi.fn(), onUpdateTask: vi.fn(), onDeleteTasks: vi.fn()
};

afterEach(() => {
  cleanup();
  useAuthStore.getState().clearSession();
});

describe('LocalListTaskSurface filters', () => {
  it('keeps Complete last without treating a custom Done status as closed', () => {
    expect(buildLocalTaskStatusOptions(groups, []).map((option) => option.label)).toEqual(['DONE', 'OPEN', 'COMPLETE']);
  });

  it('uses the configured color for the selected API status', () => {
    const options = buildLocalTaskStatusOptions(groups, []);
    render(<StatusPicker value="Complete" statusGroupId="complete" options={options} onChange={vi.fn()} open={false} onOpenChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'COMPLETE' })).toHaveClass('bg-emerald-600');
  });
  it('describes status transitions instead of showing a generic update', () => {
    expect(formatSystemActivityMessage({
      id: 'activity-1', eventType: 'TASK_UPDATED', actorName: 'Khanh', createdAt: '2026-07-20T00:00:00.000Z',
      metadata: { changedFields: ['statusId'], statusFrom: 'Open', statusTo: 'Done' }
    })).toBe('changed status from OPEN to DONE');
  });
  it('renders multiple assignee avatars and removes one assignment', async () => {
    const onChange = vi.fn();
    const people = [
      { userId: 'user-a', displayName: 'Alice', initials: 'A', avatarUrl: null },
      { userId: 'user-b', displayName: 'Bob', initials: 'B', avatarUrl: null },
    ];
    render(<AssigneePicker value="Alice" assigneeId="user-a" assigneeIds={['user-a', 'user-b']} selectedAssignees={people.map((person) => ({ id: person.userId, displayName: person.displayName, initials: person.initials, avatarUrl: null }))} assignees={people} onChange={onChange} open={false} onOpenChange={vi.fn()} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Unassign Alice' }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ assigneeIds: ['user-b'], assigneeId: 'user-b' }));
  });
  it('can hide closed tasks and show only tasks assigned to the current user', async () => {
    useAuthStore.getState().setSession({
      accessToken: 'token', tokenType: 'Bearer', expiresIn: 900, csrfToken: 'csrf',
      user: { id: 'me', email: 'me@clickflow.local', displayName: 'Khanh Tran', avatarUrl: null, timezone: 'UTC', locale: 'en' }
    });
    render(<LocalListTaskSurface view="List" tasks={[
      task('mine', 'My open task', 'open', 'me'),
      task('other', 'Other open task', 'open', 'other'),
      task('closed', 'My closed task', 'complete', 'me'),
    ]} statusGroups={groups} statusOverrides={[]} {...callbacks} />);

    expect(screen.getByRole('button', { name: 'My closed task' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Hide closed' }));
    expect(screen.queryByRole('button', { name: 'My closed task' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Assigned to me' }));
    expect(screen.getByRole('button', { name: 'My open task' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Other open task' })).not.toBeInTheDocument();
  });
});
