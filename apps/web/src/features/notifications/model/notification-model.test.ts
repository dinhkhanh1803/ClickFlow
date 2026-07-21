import { describe, expect, it } from 'vitest';
import type { ActivityApiResponse, TaskApiResponse } from '@clickflow/contracts';

import { mapActivityNotifications, relativeTime } from './notification-model';

const task = {
  id: 'task-1', workspaceId: 'workspace-1', projectId: 'project-1', sectionId: 'section-1', title: 'Ship notifications', assigneeId: 'current-user', createdAt: '2026-07-19T01:00:00.000Z',
} as TaskApiResponse;

const activity = {
  id: 'activity-1', eventType: 'COMMENT_CREATED', subjectType: 'TASK', subjectId: task.id, metadata: {},
  actor: { id: 'user-1', displayName: 'Minh Tran', initials: 'MT', avatarUrl: null }, createdAt: '2026-07-19T02:55:00.000Z',
} satisfies ActivityApiResponse;

describe('personal notification model', () => {
  it('maps activity on an assigned task and preserves read state', () => {
    const [notification] = mapActivityNotifications([activity], [task], 'current-user', new Set([activity.id]), new Date('2026-07-19T03:00:00.000Z'));
    expect(notification).toMatchObject({
      title: 'New comment', description: 'Minh Tran commented on "Ship notifications".', time: '5m ago', read: true,
    });
    expect(notification?.href).toContain('space=workspace-1');
    expect(notification?.href).toContain('task=task-1');
  });

  it('identifies assignment and status changes from activity metadata', () => {
    const assignment = { ...activity, id: 'assigned', eventType: 'TASK_UPDATED', metadata: { changedFields: ['assigneeId'], assigneeId: 'current-user' } };
    const statusChange = { ...activity, id: 'status', eventType: 'TASK_UPDATED', metadata: { changedFields: ['statusId'], statusId: 'status-progress' } };
    const notifications = mapActivityNotifications([assignment, statusChange], [task], 'current-user', new Set(), new Date('2026-07-19T03:00:00.000Z'));

    expect(notifications.map(({ title }) => title)).toEqual(['Assigned to you', 'Status changed']);
    expect(notifications[0]?.description).toBe('Minh Tran assigned you to "Ship notifications".');
  });

  it('notifies every assigned user about task activity', () => {
    const sharedTask = {
      ...task,
      assigneeId: 'user-a',
      assignees: [
        { id: 'user-a', displayName: 'User A', initials: 'UA', avatarUrl: null },
        { id: 'user-b', displayName: 'User B', initials: 'UB', avatarUrl: null },
      ],
    };

    expect(mapActivityNotifications([activity], [sharedTask], 'user-a', new Set())).toHaveLength(1);
    expect(mapActivityNotifications([activity], [sharedTask], 'user-b', new Set())).toHaveLength(1);
    expect(mapActivityNotifications([activity], [sharedTask], 'user-c', new Set())).toHaveLength(0);
  });

  it('recognizes a multi-assignee assignment notification', () => {
    const assignment = { ...activity, eventType: 'TASK_UPDATED', metadata: { changedFields: ['assigneeIds'], assigneeIds: ['user-a', 'user-b'] } };
    const sharedTask = { ...task, assignees: [{ id: 'user-b', displayName: 'User B', initials: 'UB', avatarUrl: null }] };
    const [notification] = mapActivityNotifications([assignment], [sharedTask], 'user-b', new Set());

    expect(notification?.title).toBe('Assigned to you');
  });
  it('excludes unrelated tasks and actions performed by the current user', () => {
    const selfActivity = { ...activity, id: 'self', actor: { id: 'current-user', displayName: 'Me', initials: 'ME', avatarUrl: null } };
    const unrelatedTask = { ...task, id: 'task-2', assigneeId: 'someone-else' };
    const unrelatedActivity = { ...activity, id: 'unrelated', subjectId: unrelatedTask.id };

    expect(mapActivityNotifications([selfActivity, unrelatedActivity], [task, unrelatedTask], 'current-user', new Set())).toEqual([]);
  });

  it('formats recent activity without negative values', () => {
    expect(relativeTime('2026-07-19T03:00:10.000Z', new Date('2026-07-19T03:00:00.000Z'))).toBe('Just now');
  });
});
