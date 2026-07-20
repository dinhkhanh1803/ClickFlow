import type { ActivityApiResponse, TaskApiResponse } from '@clickflow/contracts';

export type ActivityNotification = {
  id: string;
  title: string;
  description: string;
  time: string;
  href: string;
  read: boolean;
};

type NotificationCopy = { title: string; action: string };

const eventLabels: Record<string, NotificationCopy> = {
  TASK_UPDATED: { title: 'Task updated', action: 'updated' },
  TASK_MOVED: { title: 'Status changed', action: 'changed the status of' },
  TASK_COMPLETED: { title: 'Task completed', action: 'completed' },
  TASK_ARCHIVED: { title: 'Task archived', action: 'archived' },
  TASK_RESTORED: { title: 'Task restored', action: 'restored' },
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

function changedFields(activity: ActivityApiResponse): string[] {
  const value = activity.metadata.changedFields;
  return Array.isArray(value) ? value.filter((field): field is string => typeof field === 'string') : [];
}

function activityAssignsUser(activity: ActivityApiResponse, currentUserId: string): boolean {
  const assigneeIds = activity.metadata.assigneeIds;
  return activity.metadata.assigneeId === currentUserId
    || (Array.isArray(assigneeIds) && assigneeIds.includes(currentUserId));
}

function taskIsAssignedToUser(task: TaskApiResponse, currentUserId: string): boolean {
  return task.assigneeId === currentUserId || (task.assignees ?? []).some((assignee) => assignee.id === currentUserId);
}
function notificationCopy(activity: ActivityApiResponse, currentUserId: string): NotificationCopy {
  const fields = changedFields(activity);
  if ((activity.eventType === 'TASK_CREATED' || fields.includes('assigneeId') || fields.includes('assigneeIds')) && activityAssignsUser(activity, currentUserId)) {
    return { title: 'Assigned to you', action: 'assigned you to' };
  }
  if (activity.eventType === 'TASK_UPDATED' && fields.includes('statusId')) {
    return { title: 'Status changed', action: 'changed the status of' };
  }
  return eventLabels[activity.eventType] ?? { title: sentenceCase(activity.eventType), action: 'changed' };
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
  currentUserId: string,
  readIds: ReadonlySet<string>,
  now = new Date(),
): ActivityNotification[] {
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  return [...activities]
    .filter((activity) => {
      if (activity.subjectType !== 'TASK' || activity.actor?.id === currentUserId) return false;
      const task = tasksById.get(activity.subjectId);
      if (!task || !taskIsAssignedToUser(task, currentUserId)) return false;
      if (activity.eventType === 'TASK_CREATED') return activityAssignsUser(activity, currentUserId);
      return true;
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 30)
    .map((activity) => {
      const task = tasksById.get(activity.subjectId)!;
      const copy = notificationCopy(activity, currentUserId);
      const actor = activity.actor?.displayName ?? 'ClickFlow';
      const parameters = new URLSearchParams({ task: activity.subjectId, view: 'Overview', space: task.workspaceId, project: task.projectId });
      return {
        id: activity.id,
        title: copy.title,
        description: `${actor} ${copy.action} "${task.title}".`,
        time: relativeTime(activity.createdAt, now),
        href: `/projects?${parameters.toString()}`,
        read: readIds.has(activity.id),
      };
    });
}
