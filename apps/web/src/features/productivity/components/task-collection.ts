import type { LocalListTask, LocalSpace, LocalSpaceItem } from '@/features/workspace/model/local-navigation';

export type CollectedTask = {
  task: LocalListTask;
  list: LocalSpaceItem;
  folder?: LocalSpaceItem;
  space: LocalSpace;
};

export function collectWorkspaceTasks(spaces: LocalSpace[] | undefined): CollectedTask[] {
  return (spaces ?? []).flatMap((space) => space.items.flatMap((item) => {
    if (item.kind !== 'list') return [];
    const folder = item.parentId ? space.items.find((candidate) => candidate.id === item.parentId && candidate.kind === 'folder') : undefined;
    return (item.tasks ?? []).map((task) => ({ task, list: item, folder, space }));
  }));
}

export function taskHref(item: CollectedTask): string {
  const params = new URLSearchParams({ space: item.space.id, list: item.list.id });
  if (item.folder) params.set('folder', item.folder.id);
  return '/projects?' + params.toString();
}

export function taskLocation(item: CollectedTask): string {
  return [item.space.name, item.folder?.name, item.list.name].filter(Boolean).join(' / ');
}

export function compareByDueDate(left: CollectedTask, right: CollectedTask): number {
  const leftDate = left.task.dueDate || '9999-12-31';
  const rightDate = right.task.dueDate || '9999-12-31';
  if (leftDate !== rightDate) return leftDate.localeCompare(rightDate);
  return left.task.createdAt.localeCompare(right.task.createdAt);
}

export function formatTaskDate(value: string): string {
  if (!value) return 'No due date';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value + 'T00:00:00'));
}
