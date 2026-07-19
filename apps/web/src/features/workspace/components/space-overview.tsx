'use client';

import { useEffect, useState } from 'react';
import { Bookmark, CalendarDays, ChevronDown, Columns3, FileText, Folder, GanttChartSquare, LayoutDashboard, LayoutList, Link2, ListChecks, LockKeyhole, Plus, RefreshCw, Settings2, Table2, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { PageState } from '@/components/states/page-state';
import { toast } from 'sonner';
import { defaultLocalSpaces, loadLocalSpaces, localId, saveLocalSpaces, type LocalListTask, type LocalSpace, type LocalSpaceItemKind, type LocalStatusColor, type LocalStatusScope, type LocalTaskStatus } from '../model/local-navigation';
import { useWorkspace } from '../model/workspace-store';
import type { Project, Task } from '../model/workspace-types';
import { LocalListTaskSurface } from './local-list-task-surface';
import { LocalCalendarTaskSurface } from './local-calendar-task-surface';
import { LocalTableTaskSurface } from './local-table-task-surface';
import { LocalGanttTaskSurface } from './local-gantt-task-surface';
import { TaskStatusChart } from './task-status-chart';
import { TaskAssignmentChart } from './task-assignment-chart';
import { SpaceTabContent, SpaceTaskModal, type SpaceView } from './space-tab-content';
import { useArchiveTaskMutation, useCreateCommentMutation, useCreateProjectMutation, useCreateRootSectionMutation, useCreateSectionMutation, useCreateStatusMutation, useCreateTaskMutation, useUpdateStatusMutation, useUpdateTaskMutation, useWorkspaceNavigationQuery } from '../data/workspace-queries';

const spaceViews: Array<{ name: SpaceView; icon: typeof Columns3; iconClassName: string }> = [
  { name: 'Overview', icon: LayoutDashboard, iconClassName: 'text-violet-500' },
  { name: 'Board', icon: Columns3, iconClassName: 'text-blue-500' },
  { name: 'List', icon: LayoutList, iconClassName: 'text-slate-500 dark:text-slate-400' },
  { name: 'Calendar', icon: CalendarDays, iconClassName: 'text-orange-500' },
  { name: 'Table', icon: Table2, iconClassName: 'text-emerald-500' },
  { name: 'Gantt', icon: GanttChartSquare, iconClassName: 'text-rose-500' },
];

type SelectedTask = { project: Project; task: Task } | null;

export function SpaceOverview() {
  const { space, selectProject, createProject } = useWorkspace();
  const [creating, setCreating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [activeView, setActiveView] = useState<SpaceView>('Overview');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [localSpaces, setLocalSpaces] = useState<LocalSpace[]>(defaultLocalSpaces);
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<SelectedTask>(null);
  const [navigationCreateKind, setNavigationCreateKind] = useState<Extract<LocalSpaceItemKind, 'folder' | 'list'> | null>(null);
  const [navigationName, setNavigationName] = useState('');
  const navigationQuery = useWorkspaceNavigationQuery();
  const createProjectMutation = useCreateProjectMutation();
  const createSectionMutation = useCreateSectionMutation();
  const createRootSectionMutation = useCreateRootSectionMutation();
  const createTaskMutation = useCreateTaskMutation();
  const updateTaskMutation = useUpdateTaskMutation();
  const archiveTaskMutation = useArchiveTaskMutation();
  const createStatusMutation = useCreateStatusMutation();
  const updateStatusMutation = useUpdateStatusMutation();
  const effectiveLocalSpaces = navigationQuery.data ?? localSpaces;
  const projects = space.projects.filter((project) => !project.archived);
  const createCommentMutation = useCreateCommentMutation();
  const query = new URLSearchParams(locationQuery);
  const spaceId = query.get('space');
  const folderId = query.get('folder');
  const listId = query.get('list');
  const selectedLocalSpace = effectiveLocalSpaces.find((item) => item.id === spaceId) ?? effectiveLocalSpaces[0];
  const selectedFolder = selectedLocalSpace?.items.find((item) => item.id === folderId && item.kind === 'folder');
  const selectedList = selectedLocalSpace?.items.find((item) => item.id === listId && item.kind === 'list' && (!selectedFolder || item.parentId === selectedFolder.id));
  const folders = selectedLocalSpace?.items.filter((item) => item.kind === 'folder') ?? [];
  const docs = selectedLocalSpace?.items.filter((item) => item.kind === 'doc' && (!selectedFolder || item.parentId === selectedFolder.id)) ?? [];
  const lists = selectedFolder ? selectedLocalSpace?.items.filter((item) => item.kind === 'list' && item.parentId === selectedFolder.id) ?? [] : [];
  const spaceLists = selectedLocalSpace?.items.filter((item) => item.kind === 'list') ?? [];
  const visibleLocalLists = selectedList ? [selectedList] : selectedFolder ? lists : spaceLists;
  const visibleLocalTasks = visibleLocalLists.flatMap((item) => item.tasks ?? []);
  const recentLocalTasks = visibleLocalLists.flatMap((list) => (list.tasks ?? []).map((task) => ({ list, task }))).slice(0, 4);
  const navigationStatusGroups = selectedList
    ? [...(selectedFolder?.statusGroups ?? []), ...(selectedList.statusGroups ?? [])]
    : selectedFolder
      ? [...(selectedFolder.statusGroups ?? []), ...visibleLocalLists.flatMap((item) => item.statusGroups ?? [])]
      : [...folders.flatMap((item) => item.statusGroups ?? []), ...visibleLocalLists.flatMap((item) => item.statusGroups ?? [])];
  const scopedStatusGroups = Array.from(new Map([...(selectedLocalSpace?.statusGroups ?? []), ...navigationStatusGroups].map((group) => [group.id, group])).values());
  const scopedStatusOverrides = [...(selectedLocalSpace?.statusOverrides ?? []), ...(selectedFolder?.statusOverrides ?? []), ...visibleLocalLists.flatMap((item) => item.statusOverrides ?? [])];
  const title = selectedList ? `${selectedLocalSpace?.name} / ${selectedFolder?.name ?? 'Lists'} / ${selectedList.name}` : selectedFolder ? `${selectedLocalSpace?.name} / ${selectedFolder.name}` : selectedLocalSpace?.name ?? space.name;
  const availableViews = selectedList ? spaceViews.filter((view) => view.name !== 'Overview') : spaceViews;
  const displayedView: SpaceView = selectedList && activeView === 'Overview' ? 'List' : activeView;

  useEffect(() => {
    const refreshNavigation = () => {
      setLocalSpaces(loadLocalSpaces());
      setLocationQuery(window.location.search);
    };
    refreshNavigation();
    window.addEventListener('clickflow:local-spaces-changed', refreshNavigation);
    window.addEventListener('clickflow:space-navigation', refreshNavigation);
    window.addEventListener('popstate', refreshNavigation);
    return () => {
      window.removeEventListener('clickflow:local-spaces-changed', refreshNavigation);
      window.removeEventListener('clickflow:space-navigation', refreshNavigation);
      window.removeEventListener('popstate', refreshNavigation);
    };
  }, []);

  useEffect(() => {
    const parameters = new URLSearchParams(locationQuery);
    const taskId = parameters.get('task');
    const projectId = parameters.get('project');
    if (!taskId || parameters.get('view') !== 'Overview') return;
    const project = projects.find((item) => item.id === projectId) ?? projects.find((item) => item.tasks.some((task) => task.id === taskId));
    const task = project?.tasks.find((item) => item.id === taskId);
    if (project && task) {
      // URL selection is synchronized into modal state when navigation changes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTask({ project, task });
    }
  }, [locationQuery, projects]);

  const closeTask = () => {
    setSelectedTask(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('project');
    url.searchParams.delete('task');
    url.searchParams.delete('view');
    window.history.replaceState(null, '', url);
    setLocationQuery(url.search);
  };
  const openFolder = (folder: string) => {
    const url = new URL(window.location.href);
    if (selectedLocalSpace) url.searchParams.set('space', selectedLocalSpace.id);
    url.searchParams.set('folder', folder);
    url.searchParams.delete('list');
    window.history.pushState(null, '', url);
    setLocationQuery(url.search);
  };
  const openList = (list: string) => {
    const url = new URL(window.location.href);
    if (selectedLocalSpace) url.searchParams.set('space', selectedLocalSpace.id);
    if (selectedFolder) url.searchParams.set('folder', selectedFolder.id);
    url.searchParams.set('list', list);
    window.history.pushState(null, '', url);
    setActiveView('List');
    setLocationQuery(url.search);
  };
  const openDocument = (doc: import('../model/local-navigation').LocalSpaceItem) => {
    const url = new URL(window.location.href);
    if (selectedLocalSpace) url.searchParams.set('space', selectedLocalSpace.id);
    if (doc.parentId) url.searchParams.set('folder', doc.parentId); else url.searchParams.delete('folder');
    url.searchParams.delete('list');
    url.searchParams.set('doc', doc.id);
    window.history.pushState(null, '', url.pathname + url.search);
    window.dispatchEvent(new Event('clickflow:space-navigation'));
  };
  const beginNavigationCreate = (kind: Extract<LocalSpaceItemKind, 'folder' | 'list'>) => {
    setNavigationCreateKind(kind);
    setNavigationName('');
  };
  const submitNavigationCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = navigationName.trim();
    if (!nextName || !navigationCreateKind || !selectedLocalSpace) return;
    if (!navigationQuery.usesApi) {
      const nextSpaces = localSpaces.map((localSpace) => localSpace.id === selectedLocalSpace.id ? {
        ...localSpace,
        items: [...localSpace.items, { id: localId(navigationCreateKind), name: nextName, kind: navigationCreateKind, ...(navigationCreateKind === 'list' && selectedFolder ? { parentId: selectedFolder.id } : {}) }],
      } : localSpace);
      setLocalSpaces(nextSpaces);
      saveLocalSpaces(nextSpaces);
      setNavigationCreateKind(null);
      return;
    }
    try {
      if (navigationCreateKind === 'folder') {
        await createProjectMutation.mutateAsync({ workspaceId: selectedLocalSpace.id, input: { name: nextName } });
      } else if (selectedFolder) {
        await createSectionMutation.mutateAsync({ workspaceId: selectedLocalSpace.id, projectId: selectedFolder.id, input: { name: nextName } });
      } else await createRootSectionMutation.mutateAsync({ workspaceId: selectedLocalSpace.id, name: nextName });
      setNavigationCreateKind(null);
    } catch { toast.error('Unable to create this item.'); }
  };
  const createLocalListTask = async (input: { title: string; status: LocalTaskStatus; statusGroupId?: string }) => {
    if (!selectedLocalSpace || !selectedList) return;
    if (navigationQuery.usesApi) {
      const projectId = selectedList.apiProjectId ?? selectedList.parentId;
      if (!projectId || !input.statusGroupId) {
        toast.error('This List needs an API Project and status before creating Tasks.');
        return;
      }
      try {
        await createTaskMutation.mutateAsync({
          workspaceId: selectedLocalSpace.id,
          input: { projectId, sectionId: selectedList.id, statusId: input.statusGroupId, title: input.title, priority: 'NORMAL' }
        });
      } catch { toast.error('Unable to create the Task.'); }
      return;
    }
    const nextSpaces = localSpaces.map((localSpace) => localSpace.id === selectedLocalSpace.id ? {
      ...localSpace,
      items: localSpace.items.map((item) => item.id === selectedList.id ? {
        ...item,
        tasks: [...(item.tasks ?? []), ({ id: localId('task'), title: input.title, status: input.status, statusGroupId: input.statusGroupId, priority: 'Normal', assignee: '', startDate: '', dueDate: '', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], attachments: [], createdAt: new Date().toISOString() } satisfies LocalListTask)],
      } : item),
    } : localSpace);
    setLocalSpaces(nextSpaces);
    saveLocalSpaces(nextSpaces);
  };
  const updateLocalListTask = async (taskId: string, patch: Partial<Omit<import('../model/local-navigation').LocalListTask, 'id' | 'createdAt'>>) => {
    if (!selectedLocalSpace) return;
    if (navigationQuery.usesApi) {
      const list = selectedLocalSpace.items.find((item) => (item.tasks ?? []).some((task) => task.id === taskId));
      const task = list?.tasks?.find((item) => item.id === taskId);
      const projectId = list?.apiProjectId ?? list?.parentId;
      if (!projectId || !task?.version) return;
      if (patch.comments && patch.comments.length > task.comments.length) {
        const comment = patch.comments[patch.comments.length - 1];
        const body = [comment.body, ...(comment.links ?? [])].filter(Boolean).join('\n');
        if (body.trim()) {
          try { await createCommentMutation.mutateAsync({ workspaceId: selectedLocalSpace.id, taskId, body }); }
          catch { toast.error('Unable to post the comment.'); }
        }
        return;
      }
      const input: import('@clickflow/contracts').TaskUpdateRequest = { version: task.version };
      if (patch.title !== undefined) input.title = patch.title;
      if (patch.description !== undefined) input.description = patch.description || null;
      if (patch.statusGroupId !== undefined) input.statusId = patch.statusGroupId;
      if (patch.priority !== undefined) input.priority = ({ Urgent: 'URGENT', High: 'HIGH', Normal: 'NORMAL', Low: 'LOW' } as const)[patch.priority];
      if (patch.dueDate !== undefined) input.dueAt = patch.dueDate ? `${patch.dueDate}T00:00:00.000Z` : null;
      if (patch.assignee === '') input.assigneeId = null;
      if (Object.keys(input).length === 1) {
        toast.info('This field will be connected in a later integration task.');
        return;
      }
      try {
        await updateTaskMutation.mutateAsync({ workspaceId: selectedLocalSpace.id, projectId, taskId, input });
      } catch { toast.error('Unable to update the Task. Refresh and try again.'); }
      return;
    }
    const nextSpaces = localSpaces.map((localSpace) => localSpace.id === selectedLocalSpace.id ? {
      ...localSpace,
      items: localSpace.items.map((item) => (item.tasks ?? []).some((task) => task.id === taskId) ? {
        ...item,
        tasks: (item.tasks ?? []).map((task) => task.id === taskId ? { ...task, ...patch } : task),
      } : item),
    } : localSpace);
    setLocalSpaces(nextSpaces);
    saveLocalSpaces(nextSpaces);
  };
  const deleteLocalListTasks = async (taskIds: string[]) => {
    if (!selectedLocalSpace || !selectedList || !taskIds.length) return;
    if (navigationQuery.usesApi) {
      const projectId = selectedList.apiProjectId ?? selectedList.parentId;
      if (!projectId) return;
      const tasks = (selectedList.tasks ?? []).filter((task) => taskIds.includes(task.id) && task.version);
      try {
        await Promise.all(tasks.map((task) => archiveTaskMutation.mutateAsync({ workspaceId: selectedLocalSpace.id, projectId, taskId: task.id, version: task.version! })));
      } catch { toast.error('Unable to archive one or more Tasks.'); }
      return;
    }
    const selectedIds = new Set(taskIds);
    const nextSpaces = localSpaces.map((localSpace) => localSpace.id === selectedLocalSpace.id ? {
      ...localSpace,
      items: localSpace.items.map((item) => item.id === selectedList.id ? { ...item, tasks: (item.tasks ?? []).filter((task) => !selectedIds.has(task.id)) } : item),
    } : localSpace);
    setLocalSpaces(nextSpaces);
    saveLocalSpaces(nextSpaces);
  };
  const createScopedStatus = async (input: { name: string; scope: LocalStatusScope }) => {
    if (!selectedLocalSpace || !selectedList) return;
    if (navigationQuery.usesApi) {
      const projectId = selectedList.apiProjectId ?? selectedList.parentId;
      if (!projectId) return;
      try {
        await createStatusMutation.mutateAsync({ workspaceId: selectedLocalSpace.id, projectId, input: { name: input.name, color: '#6366f1', category: 'OPEN' } });
      } catch { toast.error('Unable to create the status.'); }
      return;
    }
    const group = { id: localId('status'), taskStatus: localId('status-value'), name: input.name, color: 'indigo' as const, scope: input.scope };
    const nextSpaces = localSpaces.map((localSpace) => {
      if (localSpace.id !== selectedLocalSpace.id) return localSpace;
      if (input.scope === 'space') return { ...localSpace, statusGroups: [...(localSpace.statusGroups ?? []), group] };
      return { ...localSpace, items: localSpace.items.map((item) => item.id === (input.scope === 'folder' ? selectedFolder?.id : selectedList.id) ? { ...item, statusGroups: [...(item.statusGroups ?? []), group] } : item) };
    });
    setLocalSpaces(nextSpaces);
    saveLocalSpaces(nextSpaces);
  };
  const updateScopedStatus = async (input: { status: LocalTaskStatus; groupId?: string; name: string; color: LocalStatusColor }) => {
    if (!selectedLocalSpace || !selectedList) return;
    if (navigationQuery.usesApi) {
      const projectId = selectedList.apiProjectId ?? selectedList.parentId;
      if (!projectId || !input.groupId) return;
      const colors: Record<LocalStatusColor, string> = { slate: '#64748b', blue: '#3b82f6', indigo: '#6366f1', violet: '#8b5cf6', teal: '#14b8a6', emerald: '#10b981', amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', pink: '#ec4899' };
      try {
        await updateStatusMutation.mutateAsync({ workspaceId: selectedLocalSpace.id, projectId, statusId: input.groupId, input: { name: input.name, color: colors[input.color] } });
      } catch { toast.error('Unable to update the status.'); }
      return;
    }
    const updateItem = (item: import('../model/local-navigation').LocalSpaceItem) => {
      if (input.groupId) return { ...item, statusGroups: (item.statusGroups ?? []).map((group) => group.id === input.groupId ? { ...group, name: input.name, color: input.color } : group) };
      if (item.id !== selectedList.id) return item;
      const overrides = item.statusOverrides ?? [];
      const existing = overrides.find((override) => override.status === input.status);
      return { ...item, statusOverrides: existing ? overrides.map((override) => override.status === input.status ? { ...override, name: input.name, color: input.color } : override) : [...overrides, { status: input.status, name: input.name, color: input.color }] };
    };
    const nextSpaces = localSpaces.map((localSpace) => {
      if (localSpace.id !== selectedLocalSpace.id) return localSpace;
      if (input.groupId && localSpace.statusGroups?.some((group) => group.id === input.groupId)) return { ...localSpace, statusGroups: localSpace.statusGroups.map((group) => group.id === input.groupId ? { ...group, name: input.name, color: input.color } : group) };
      if (input.groupId) return { ...localSpace, items: localSpace.items.map(updateItem) };
      return { ...localSpace, items: localSpace.items.map(updateItem) };
    });
    setLocalSpaces(nextSpaces);
    saveLocalSpaces(nextSpaces);
  };
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !selectedLocalSpace) return;
    if (!navigationQuery.usesApi) {
      createProject({ name: name.trim(), description: description.trim() || 'New project in this Space.', folderId: selectedFolder?.id });
      setName('');
      setDescription('');
      setCreating(false);
      return;
    }
    try {
      await createProjectMutation.mutateAsync({ workspaceId: selectedLocalSpace.id, input: { name: name.trim(), description: description.trim() || null } });
      setName('');
      setDescription('');
      setCreating(false);
    } catch { toast.error('Unable to create the Project.'); }
  };

  if (navigationQuery.isLoading) return <PageState title="Spaces" kind="loading" />;
  if (navigationQuery.isError) return <PageState title="Spaces" kind="error" />;
  if (!selectedLocalSpace) return <PageState title="Spaces" kind="empty" />;

  return <main className="min-h-[calc(100vh-4rem)] bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex min-h-14 items-center justify-between gap-3 px-5"><div className="flex min-w-0 items-center gap-2 text-sm"><span className="grid h-4 w-4 shrink-0 place-items-center rounded bg-indigo-500 text-[9px] font-bold text-white">T</span><span className="truncate font-semibold">{title}</span></div><button type="button" onClick={() => setSharing(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"><Users size={16} />Share</button></div>
      <div role="tablist" aria-label="Space views" className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-4 dark:border-slate-900">{availableViews.map(({ name: view, icon: Icon, iconClassName }) => <button key={view} role="tab" aria-selected={displayedView === view} onClick={() => setActiveView(view)} className={`flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-3 text-sm ${displayedView === view ? 'border-slate-900 font-semibold dark:border-white' : 'border-transparent text-slate-500 hover:text-indigo-600'}`}><Icon aria-hidden="true" size={15} strokeWidth={2.2} className={`shrink-0 ${iconClassName}`} />{view}</button>)}<span className="flex shrink-0 items-center gap-1 px-3 py-3 text-sm text-slate-500"><Plus size={15} />View</span></div>
    </header>
{displayedView === 'Overview' && <div className="flex items-center justify-end gap-3 border-b border-slate-100 px-5 py-3 text-xs text-slate-500 dark:border-slate-900"><span className="inline-flex items-center gap-1 text-emerald-600"><RefreshCw size={13} />All changes saved</span><button className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-200">Auto refresh: On</button><button aria-label="Overview settings" className="rounded border border-slate-200 p-1.5 hover:text-indigo-600 dark:border-slate-700"><Settings2 size={15} /></button></div>}
    {displayedView === 'Overview' ? <><section className="grid gap-4 p-4 lg:grid-cols-3"><article className="min-h-72 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><h2 className="text-sm font-semibold">Recent</h2><div className="mt-4 space-y-3">{recentLocalTasks.length ? recentLocalTasks.map(({ list, task }) => <button type="button" onClick={() => openList(list.id)} key={task.id} className="flex w-full items-center gap-3 text-left text-sm hover:text-indigo-600"><ListChecks size={16} className="shrink-0 text-slate-500" /><span className="truncate">{task.title} <span className="text-slate-400">{String.fromCharCode(0x00B7)} in {list.name}</span></span></button>) : <p className="text-sm text-slate-500">No recent tasks yet.</p>}</div></article><article className="min-h-72 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><h2 className="text-sm font-semibold">Docs</h2><div className="mt-4 space-y-3">{docs.length ? docs.map((doc) => <button type="button" key={doc.id} onClick={() => openDocument(doc)} className="flex w-full items-center gap-3 text-left text-sm hover:text-indigo-600"><FileText size={16} className="text-slate-500" /><span>{doc.name} <span className="text-slate-400">{String.fromCharCode(0x00B7)} in {selectedLocalSpace?.name}</span></span></button>) : <p className="text-sm text-slate-500">No Docs in this {selectedFolder ? 'Folder' : 'Space'} yet.</p>}</div></article><article className="flex min-h-72 flex-col rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><h2 className="text-sm font-semibold">Bookmarks</h2><div className="flex flex-1 flex-col items-center justify-center text-center"><Bookmark size={44} className="text-slate-300" /><p className="mt-4 max-w-xs text-sm text-slate-500">Save a Space, project, task, or useful link for quick access.</p>{bookmarked && <p className="mt-3 text-sm font-semibold text-indigo-600">Bookmark saved locally</p>}<Button size="sm" className="mt-4" onClick={() => setBookmarked((value) => !value)}>{bookmarked ? 'Bookmark saved' : 'Add Bookmark'}</Button></div></article></section>{selectedLocalSpace ? <section className="mx-4 mb-4 grid gap-4 xl:grid-cols-2"><TaskStatusChart tasks={visibleLocalTasks} statusGroups={scopedStatusGroups} statusOverrides={scopedStatusOverrides} /><TaskAssignmentChart tasks={visibleLocalTasks} /></section> : null}<section className="mx-4 mb-4 min-h-80 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold">{selectedFolder ? 'Lists' : 'Folders'}</h2><p className="mt-1 text-xs text-slate-500">{selectedFolder ? 'Lists in ' + selectedFolder.name : 'Folders in ' + selectedLocalSpace?.name}</p></div><Button size="sm" variant="ghost" onClick={() => beginNavigationCreate(selectedFolder ? 'list' : 'folder')}><Plus size={15} />New {selectedFolder ? 'list' : 'folder'}</Button></div><div className="mt-4 flex flex-wrap gap-3">{selectedFolder ? (lists.length ? lists.map((list) => <button type="button" key={list.id} onClick={() => openList(list.id)} className="flex min-w-64 items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-left text-sm font-semibold transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:hover:bg-indigo-950/30"><ListChecks className="text-slate-500" size={20} />{list.name}</button>) : <p className="text-sm text-slate-500">No Lists in this Folder yet.</p>) : (folders.length ? folders.map((folder) => { const folderLists = selectedLocalSpace?.items.filter((item) => item.parentId === folder.id && item.kind === 'list') ?? []; return <button type="button" key={folder.id} onClick={() => openFolder(folder.id)} className="flex min-w-64 items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-left text-sm font-semibold transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:hover:bg-indigo-950/30"><Folder className="text-slate-500" size={20} />{folder.name}<span className="ml-auto text-xs font-normal text-slate-400">{folderLists.length} lists</span></button>; }) : <p className="text-sm text-slate-500">No folders in this Space yet.</p>)}</div></section></> : displayedView === 'Calendar' ? <LocalCalendarTaskSurface tasks={visibleLocalTasks} statusGroups={scopedStatusGroups} statusOverrides={scopedStatusOverrides} onUpdateTask={updateLocalListTask} /> : displayedView === 'Table' ? <LocalTableTaskSurface tasks={visibleLocalTasks} statusGroups={scopedStatusGroups} statusOverrides={scopedStatusOverrides} onUpdateTask={updateLocalListTask} /> : displayedView === 'Gantt' ? <LocalGanttTaskSurface tasks={visibleLocalTasks} statusGroups={scopedStatusGroups} statusOverrides={scopedStatusOverrides} onUpdateTask={updateLocalListTask} /> : (displayedView === 'Board' || displayedView === 'List') ? <LocalListTaskSurface view={displayedView} tasks={visibleLocalTasks} statusGroups={scopedStatusGroups} statusOverrides={scopedStatusOverrides} onCreateStatus={createScopedStatus} onUpdateStatus={updateScopedStatus} onCreateTask={createLocalListTask} onUpdateTask={updateLocalListTask} onDeleteTasks={deleteLocalListTasks} /> : <SpaceTabContent view={displayedView as Exclude<SpaceView, 'Overview'>} projects={projects} onOpenProject={selectProject} />}
    {selectedTask && <SpaceTaskModal project={selectedTask.project} task={selectedTask.task} onClose={closeTask} />}
    <Dialog open={sharing} onOpenChange={setSharing} contentClassName="max-w-lg p-0">
      <section className="overflow-hidden rounded-2xl bg-white dark:bg-slate-950"><header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800"><div><DialogTitle>Share this Space</DialogTitle><p className="mt-1 text-sm text-slate-500">Sharing {selectedLocalSpace?.name} with all views.</p></div><button type="button" aria-label="Close share dialog" onClick={() => setSharing(false)} className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"><X size={16} /></button></header><div className="space-y-5 p-5"><div className="flex gap-2 rounded-xl border border-slate-200 p-2 dark:border-slate-700"><input aria-label="Invite by name or email" placeholder="Invite by name or email" className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" /><Button size="sm">Invite</Button></div><div className="flex items-center justify-between text-sm"><span className="inline-flex items-center gap-2 font-medium"><Link2 size={16} />Private link</span><Button size="sm" variant="outline">Copy link</Button></div><div className="flex items-center justify-between text-sm"><span className="inline-flex items-center gap-2 font-medium"><Users size={16} />Default permission</span><button type="button" className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-sm dark:border-slate-700">Full edit<ChevronDown size={14} /></button></div><div className="border-t border-slate-100 pt-4 dark:border-slate-800"><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Share with</p><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-500 text-xs font-bold text-white">S1</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{selectedLocalSpace?.name}</p><p className="text-xs text-slate-500">Space members</p></div><span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-200">Full edit</span></div></div></div><footer className="border-t border-slate-100 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/60"><button type="button" className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-800"><LockKeyhole size={15} />Make Private</button></footer></section>
    </Dialog>    <Dialog open={navigationCreateKind !== null} onOpenChange={(open) => { if (!open) setNavigationCreateKind(null); }}><form onSubmit={submitNavigationCreate} className="space-y-4"><DialogTitle>New {navigationCreateKind}</DialogTitle><label className="block text-sm font-medium">{navigationCreateKind === 'folder' ? 'Folder name' : 'List name'}<input aria-label={navigationCreateKind === 'folder' ? 'Folder name' : 'List name'} value={navigationName} onChange={(event) => setNavigationName(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950" autoFocus /></label><div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setNavigationCreateKind(null)}>Cancel</Button><Button type="submit" disabled={createProjectMutation.isPending || createSectionMutation.isPending}>Create</Button></div></form></Dialog>    <Dialog open={creating} onOpenChange={setCreating}><form onSubmit={submit} className="space-y-4"><DialogTitle>Create a project</DialogTitle><label className="block text-sm font-medium">Project name<input aria-label="Project name" value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950" autoFocus /></label><label className="block text-sm font-medium">Description<textarea aria-label="Project description" value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950" /></label><div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button><Button type="submit" disabled={createProjectMutation.isPending}>Create project</Button></div></form></Dialog>
  </main>;
}
