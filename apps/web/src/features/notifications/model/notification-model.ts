import type { ActivityApiResponse, TaskApiResponse } from '@clickflow/contracts';

export type ActivityNotification = {
  id: string;
  title: string;
  description: string;
  time: string;
  href: string;
  read: boolean;
};

const eventLabels: Record<string, { title: string; action: string }> = {
  TASK_CREATED: { title: 'Task created', action: 'created' },
  TASK_UPDATED: { title: 'Task updated', action: 'updated' },
  TASK_ARCHIVED: { title: 'Task archived', action: 'archived' },
  COMMENT_CREATED: { title: 'New comment', action: 'commented on' },
  COMMENT_UPDATED: { title: 'Comment updated', action: 'updated a comment on' },
  COMMENT_DELETED: { title: 'Comment removed', action: 'removed a comment from' },
  ATTACHMENT_CREATED: { title: 'Attachment added', action: 'added an attachment to' },
  ATTACHMENT_DELETED: { title: 'Attachment removed', action: 'removed an attachment from' },
  TIMER_STARTED: { title: 'Timer started', action: 'started tracking time on' },
  TIMER_STOPPED: { title: 'Timer stopped', action: 'stopped tracking time on' },
};

function sentenceCase(value: string): string {
  const words = value.toLowerCase().replaceAll('_', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function relativeTime(isoDate: string, now = new Date()): string {
  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - new Date(isoDate).getTime()) / 1000));
  if (elapsedSeconds < 60) return 'Just now';
  const minutes = Math.floor(elapsedSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(isoDate));
}

export function mapActivityNotifications(
  activities: ActivityApiResponse[],
  tasks: TaskApiResponse[],
  readIds: ReadonlySet<string>,
  now = new Date(),
): ActivityNotification[] {
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  return [...activities]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 30)
    .map((activity) => {
      const task = tasksById.get(activity.subjectId);
      const label = eventLabels[activity.eventType] ?? { title: sentenceCase(activity.eventType), action: 'changed' };
      const actor = activity.actor?.displayName ?? 'ClickFlow';
      const taskTitle = task?.title ?? 'a task';
      const parameters = new URLSearchParams({ task: activity.subjectId, view: 'Overview' });
      if (task) {
        parameters.set('space', task.workspaceId);
        parameters.set('project', task.projectId);
      }
      return {
        id: activity.id,
        title: label.title,
        description: `${actor} ${label.action} “${taskTitle}”.`,
        time: relativeTime(activity.createdAt, now),
        href: `/projects?${parameters.toString()}`,
        read: readIds.has(activity.id),
      };
    });
}
