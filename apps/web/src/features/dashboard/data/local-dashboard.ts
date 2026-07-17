import type { LocalListTask, LocalSpace } from '@/features/workspace/model/local-navigation';

export type LocalDashboardMetric = { label: string; value: string };
export type LocalDashboardTask = LocalListTask & { listName: string; spaceName: string };
export type LocalDashboardFolderProgress = { id: string; name: string; completed: number; total: number; progress: number };

const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const isComplete = (status: string) => /complete|done/i.test(status);
const isAssignedToCurrentUser = (assignee: string) => assignee.trim().toLowerCase().split(/\\s+/)[0] === 'khanh';

export function deriveLocalDashboard(spaces: LocalSpace[], now = new Date()) {
  const today = dateKey(now);
  const lists = spaces.flatMap((space) => space.items.filter((item) => item.kind === 'list').map((list) => ({ space, list })));
  const tasks: LocalDashboardTask[] = lists.flatMap(({ space, list }) => (list.tasks ?? []).map((task) => ({ ...task, listName: list.name, spaceName: space.name })));
  const openTasks = tasks.filter((task) => !isComplete(task.status));
  const dueToday = openTasks.filter((task) => task.dueDate === today);
  const assignedToMe = openTasks.filter((task) => isAssignedToCurrentUser(task.assignee));
  const overdueTasks = openTasks.filter((task) => Boolean(task.dueDate) && task.dueDate < today);
  const upcomingDeadlines = openTasks.filter((task) => Boolean(task.dueDate) && task.dueDate >= today).sort((left, right) => left.dueDate.localeCompare(right.dueDate)).slice(0, 5);
  const folderProgress = spaces.flatMap((space) => space.items.filter((item) => item.kind === 'folder').map((folder) => {
    const folderTasks = space.items.filter((item) => item.kind === 'list' && item.parentId === folder.id).flatMap((list) => list.tasks ?? []);
    const completed = folderTasks.filter((task) => isComplete(task.status)).length;
    return { id: folder.id, name: folder.name, completed, total: folderTasks.length, progress: folderTasks.length ? Math.round((completed / folderTasks.length) * 100) : 0 };
  }).filter((folder) => folder.total > 0));

  return {
    metrics: [
      { label: 'Spaces', value: String(spaces.length) },
      { label: 'Lists', value: String(lists.length) },
      { label: 'Open tasks', value: String(openTasks.length) },
      { label: 'Overdue tasks', value: String(overdueTasks.length) },
    ] satisfies LocalDashboardMetric[],
    dueToday,
    assignedToMe,
    upcomingDeadlines,
    folderProgress,
  };
}