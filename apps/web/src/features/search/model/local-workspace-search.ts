import type { LocalSpace, LocalSpaceItemKind } from '@/features/workspace/model/local-navigation';

export type WorkspaceSearchKind = 'space' | 'folder' | 'list' | 'doc' | 'task';
export type WorkspaceSearchFilter = 'all' | 'tasks' | 'docs' | 'workspace';

export type WorkspaceSearchResult = {
  id: string;
  kind: WorkspaceSearchKind;
  label: string;
  context: string;
  href: string;
};

const kindForItem = (kind: LocalSpaceItemKind): Exclude<WorkspaceSearchKind, 'space' | 'task'> | null => {
  if (kind === 'folder' || kind === 'list' || kind === 'doc') return kind;
  return null;
};

const projectHref = (spaceId: string, folderId?: string, listId?: string, docId?: string) => {
  const query = new URLSearchParams({ space: spaceId });
  if (folderId) query.set('folder', folderId);
  if (listId) query.set('list', listId);
  if (docId) query.set('doc', docId);
  return `/projects?${query.toString()}`;
};

const matchesFilter = (result: WorkspaceSearchResult, filter: WorkspaceSearchFilter) => filter === 'all' || filter === 'tasks' && result.kind === 'task' || filter === 'docs' && result.kind === 'doc' || filter === 'workspace' && ['space', 'folder', 'list'].includes(result.kind);

export function searchLocalWorkspace(spaces: LocalSpace[], query: string, filter: WorkspaceSearchFilter = 'all') {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return [];

  const results: WorkspaceSearchResult[] = [];
  for (const space of spaces) {
    if (space.name.toLocaleLowerCase().includes(normalized)) results.push({ id: `space:${space.id}`, kind: 'space', label: space.name, context: 'Space', href: projectHref(space.id) });
    for (const item of space.items) {
      const kind = kindForItem(item.kind);
      const parent = item.parentId ? space.items.find((candidate) => candidate.id === item.parentId) : undefined;
      const context = parent ? `${space.name} / ${parent.name}` : space.name;
      if (kind && item.name.toLocaleLowerCase().includes(normalized)) results.push({ id: `${kind}:${item.id}`, kind, label: item.name, context, href: kind === 'folder' ? projectHref(space.id, item.id) : kind === 'list' ? projectHref(space.id, item.parentId, item.id) : projectHref(space.id, item.parentId, undefined, item.id) });
      if (item.kind === 'list') for (const task of item.tasks ?? []) if (task.title.toLocaleLowerCase().includes(normalized)) results.push({ id: `task:${task.id}`, kind: 'task', label: task.title, context: `${space.name} / ${parent?.name ?? 'Lists'} / ${item.name}`, href: projectHref(space.id, item.parentId, item.id) });
    }
  }
  return results.filter((result) => matchesFilter(result, filter));
}