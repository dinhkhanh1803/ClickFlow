import { describe, expect, it } from 'vitest';
import type { ActivityApiResponse, TaskApiResponse } from '@clickflow/contracts';

import { mapActivityNotifications, relativeTime } from './notification-model';

const task = {
  id: 'task-1', workspaceId: 'workspace-1', projectId: 'project-1', sectionId: 'section-1', title: 'Ship notifications',
} as TaskApiResponse;

const activity = {
  id: 'activity-1', eventType: 'COMMENT_CREATED', subjectType: 'TASK', subjectId: task.id, metadata: {},
  actor: { id: 'user-1', displayName: 'Minh Tran', initials: 'MT', avatarUrl: null }, createdAt: '2026-07-19T02:55:00.000Z',
} satisfies ActivityApiResponse;

describe('activity notification model', () => {
  it('maps API activity to a task notification and preserves read state', () => {
    const [notification] = mapActivityNotifications([activity], [task], new Set([activity.id]), new Date('2026-07-19T03:00:00.000Z'));
    expect(notification).toMatchObject({
      title: 'New comment', description: 'Minh Tran commented on “Ship notifications”.', time: '5m ago', read: true,
    });
    expect(notification?.href).toContain('space=workspace-1');
    expect(notification?.href).toContain('task=task-1');
  });

  it('formats recent activity without negative values', () => {
    expect(relativeTime('2026-07-19T03:00:10.000Z', new Date('2026-07-19T03:00:00.000Z'))).toBe('Just now');
  });
});
