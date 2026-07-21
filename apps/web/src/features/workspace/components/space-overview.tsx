'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bookmark, CalendarDays, Columns3, FileText, Folder, GanttChartSquare, LayoutDashboard, LayoutList, Link2, ListChecks, Plus, RefreshCw, Settings2, Table2, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDownloadAttachmentUrlMutation, useRemoveAttachmentMutation, useUploadAttachmentMutation } from '@/features/attachments/data/attachment-queries';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { PageState } from '@/components/states/page-state';
import type { AttachmentContract, TaskApiResponse } from '@clickflow/contracts';
import { toast } from 'sonner';
import { defaultLocalSpaces, loadLocalSpaces, localId, saveLocalSpaces, type LocalListTask, type LocalSpace, type LocalSpaceItemKind, type LocalStatusColor, type LocalStatusScope, type LocalTaskStatus } from '../model/local-navigation';
import { useWorkspace } from '../model/workspace-store';
import type { Project, Task } from '../model/workspace-types';
import { buildLocalTaskStatusOptions, LocalListTaskSurface, LocalTaskDetailModal, type AssigneeOption, type AttachmentPreviewData } from './local-list-task-surface';
import { LocalCalendarTaskSurface } from './local-calendar-task-surface';
import { CreationDialog } from './creation-dialog';
import { LocalTableTaskSurface } from './local-table-task-surface';
import { LocalGanttTaskSurface } from './local-gantt-task-surface';
import { parseInviteEmails } from './share-members';
import { TaskStatusChart } from './task-status-chart';
import { TaskAssignmentChart } from './task-assignment-chart';
import { SpaceTabContent, SpaceTaskModal, type SpaceView } from './space-tab-content';
import { useArchiveTaskMutation, useCreateCommentMutation, useCreateProjectMutation, useCreateRootSectionMutation, useCreateSectionMutation, useCreateStatusMutation, useCreateTaskMutation, useDeleteStatusMutation, useStartTimerMutation, useStopTimerMutation, useUpdateStatusMutation, useUpdateTaskMutation, useSyncTaskTagsMutation, useAssignableUsersQuery, useInviteWorkspaceMemberMutation, useWorkspaceMembersQuery, useWorkspaceNavigationQuery, useWorkspaceQueryClient, workspaceKeys } from '../data/workspace-queries';
import { useCreateDocumentMutation } from '../data/document-queries';

const DEFAULT_FOLDER_LIST_NAME = 'List';

const spaceViews: Array<{ name: SpaceView; icon: typeof Columns3; iconClassName: string }> = [
  { name: 'Overview', icon: LayoutDashboard, iconClassName: 'text-violet-500' },
  { name: 'Board', icon: Columns3, iconClassName: 'text-blue-500' },
  { name: 'List', icon: LayoutList, iconClassName: 'text-slate-500 dark:text-slate-400' },
  { name: 'Calendar', icon: CalendarDays, iconClassName: 'text-orange-500' },
  { name: 'Table', icon: Table2, iconClassName: 'text-emerald-500' },
  { name: 'Gantt', icon: GanttChartSquare, iconClassName: 'text-rose-500' },
];

type SelectedTask = { project: Project; task: Task } | null;

type EmptyScope = 'space' | 'folder';

function ListRequiredEmptyState({ scope, onCreate }: { scope: EmptyScope; onCreate: (kind: Extract<LocalSpaceItemKind, 'folder' | 'list' | 'doc'>) => void }) {
  const isFolder = scope === 'folder';
  return <section className="flex min-h-[520px] items-center justify-center px-6 py-16 text-center" aria-label={isFolder ? 'Empty Folder' : 'Empty Space'}>
    <div className="flex max-w-sm flex-col items-center">
      <div aria-hidden="true" className="relative h-28 w-36 text-slate-500 dark:text-slate-600">
        <ListChecks size={72} strokeWidth={1.4} className="absolute left-5 top-5 rotate-[-6deg]" />
        <FileText size={52} strokeWidth={1.4} className="absolute right-4 top-1 rotate-[5deg]" />
        <div className="absolute bottom-2 right-5 h-16 w-16 rounded-full border-4 border-current opacity-80" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">{isFolder ? 'This Folder is empty' : 'This Space is empty'}</h2>
      <p className="mt-1 text-sm text-slate-500">{isFolder ? 'Create a List to get started' : 'Create a Folder, List or Doc to get started'}</p>
      {isFolder ? <Button size="sm" className="mt-6" onClick={() => onCreate('list')}><Plus size={15} />Create List</Button> : <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
        <button type="button" onClick={() => onCreate('folder')} className="font-medium text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-300">Create Folder</button>
        <button type="button" onClick={() => onCreate('list')} className="font-medium text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-300">Create List</button>
        <button type="button" onClick={() => onCreate('doc')} className="font-medium text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-300">Create Doc</button>
      </div>}
    </div>
  </section>;
}


export function SpaceOverview() {
  const { space, selectProject } = useWorkspace();
  const queryClient = useWorkspaceQueryClient();
  const [creating, setCreating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const [overviewSelectedTaskId, setOverviewSelectedTaskId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<SpaceView>('Overview');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [localSpaces, setLocalSpaces] = useState<LocalSpace[]>(defaultLocalSpaces);
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<SelectedTask>(null);
  const [navigationCreateKind, setNavigationCreateKind] = useState<Extract<LocalSpaceItemKind, 'folder' | 'list' | 'doc'> | null>(null);
  const [navigationName, setNavigationName] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshIntervalSeconds, setRefreshIntervalSeconds] = useState(30);
  const [overviewSettingsOpen, setOverviewSettingsOpen] = useState(false);
  const overviewSettingsRef = useRef<HTMLDivElement>(null);
  const navigationQuery = useWorkspaceNavigationQuery();
  const { refetch: refetchNavigation, usesApi: navigationUsesApi } = navigationQuery;
  const [navigationDescription, setNavigationDescription] = useState('');
  const createProjectMutation = useCreateProjectMutation();
  const createSectionMutation = useCreateSectionMutation();
  const createRootSectionMutation = useCreateRootSectionMutation();
  const createTaskMutation = useCreateTaskMutation();
  const updateTaskMutation = useUpdateTaskMutation();
  const syncTaskTagsMutation = useSyncTaskTagsMutation();
  const archiveTaskMutation = useArchiveTaskMutation();
  const createStatusMutation = useCreateStatusMutation();
  const updateStatusMutation = useUpdateStatusMutation();
  const effectiveLocalSpaces = navigationQuery.data ?? localSpaces;
  const deleteStatusMutation = useDeleteStatusMutation();
  const projects = space.projects.filter((project) => !project.archived);
  const createCommentMutation = useCreateCommentMutation();
  const uploadAttachmentMutation = useUploadAttachmentMutation();
  const removeAttachmentMutation = useRemoveAttachmentMutation();
  const downloadAttachmentUrlMutation = useDownloadAttachmentUrlMutation();
  const createDocumentMutation = useCreateDocumentMutation();
  const query = new URLSearchParams(locationQuery);
  const startTimerMutation = useStartTimerMutation();
  const stopTimerMutation = useStopTimerMutation();
  const spaceId = query.get('space');
  const folderId = query.get('folder');
  const listId = query.get('list');
  const selectedLocalSpace = effectiveLocalSpaces.find((item) => item.id === spaceId) ?? effectiveLocalSpaces[0];
  const canEditSelectedSpace = !selectedLocalSpace || selectedLocalSpace.role !== 'PUBLIC' || selectedLocalSpace.publicAccess === 'EDIT';
  const canShareSelectedSpace = !selectedLocalSpace?.role || selectedLocalSpace.role === 'OWNER';
  const assignableUsersQuery = useAssignableUsersQuery(navigationQuery.usesApi);
  const membersQuery = useWorkspaceMembersQuery(selectedLocalSpace?.id, sharing && navigationQuery.usesApi);
  const inviteMemberMutation = useInviteWorkspaceMemberMutation();
  const localAssignees: AssigneeOption[] = selectedLocalSpace?.members?.map((member) => ({ userId: member.userId, displayName: member.displayName, initials: member.initials, avatarUrl: member.avatarUrl }))
    ?? (selectedLocalSpace?.createdBy ? [{
      userId: selectedLocalSpace.createdBy.id,
      displayName: selectedLocalSpace.createdBy.displayName,
      initials: selectedLocalSpace.createdBy.displayName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || selectedLocalSpace.createdBy.displayName.slice(0, 1).toUpperCase(),
      avatarUrl: selectedLocalSpace.createdBy.avatarUrl,
    }] : []);
  const assignees: AssigneeOption[] = navigationQuery.usesApi
    ? (assignableUsersQuery.data ?? []).map((user) => ({ userId: user.id, displayName: user.displayName, initials: user.initials, avatarUrl: user.avatarUrl, email: user.email }))
    : localAssignees;
  const selectedFolder = selectedLocalSpace?.items.find((item) => item.id === folderId && item.kind === 'folder');
  const selectedList = selectedLocalSpace?.items.find((item) => item.id === listId && item.kind === 'list' && (!selectedFolder || item.parentId === selectedFolder.id));
  const folders = selectedLocalSpace?.items.filter((item) => item.kind === 'folder') ?? [];
  const docs = selectedLocalSpace?.items.filter((item) => item.kind === 'doc' && (!selectedFolder || item.parentId === selectedFolder.id)) ?? [];
  const lists = selectedFolder ? selectedLocalSpace?.items.filter((item) => item.kind === 'list' && item.parentId === selectedFolder.id) ?? [] : [];
  const spaceLists = selectedLocalSpace?.items.filter((item) => item.kind === 'list') ?? [];
  const visibleLocalLists = selectedList ? [selectedList] : selectedFolder ? lists : spaceLists;
  const visibleLocalTasks = visibleLocalLists.flatMap((item) => item.tasks ?? []);
  const recentLocalTasks = visibleLocalLists.flatMap((list) => (list.tasks ?? []).map((task) => ({ list, task }))).slice(0, 4);
  const overviewSelectedTask = visibleLocalTasks.find((task) => task.id === overviewSelectedTaskId) ?? null;
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
  const isSaving = [createProjectMutation, createSectionMutation, createRootSectionMutation, createTaskMutation, updateTaskMutation, archiveTaskMutation, createStatusMutation, updateStatusMutation, deleteStatusMutation, createCommentMutation, uploadAttachmentMutation, removeAttachmentMutation, downloadAttachmentUrlMutation, createDocumentMutation, startTimerMutation, stopTimerMutation].some((mutation) => mutation.isPending);
  const needsListForDisplayedView = displayedView !== 'Overview' && visibleLocalLists.length === 0;

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

  const refreshOverview = useCallback(() => {
    if (navigationUsesApi) void refetchNavigation();
    else setLocalSpaces(loadLocalSpaces());
  }, [navigationUsesApi, refetchNavigation]);

  useEffect(() => {
    if (!autoRefresh || displayedView !== 'Overview') return;
    const intervalId = window.setInterval(refreshOverview, refreshIntervalSeconds * 1000);
    return () => window.clearInterval(intervalId);
  }, [autoRefresh, displayedView, refreshIntervalSeconds, refreshOverview]);

  useEffect(() => {
    if (!overviewSettingsOpen) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !overviewSettingsRef.current?.contains(event.target)) setOverviewSettingsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOverviewSettingsOpen(false); };
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [overviewSettingsOpen]);
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
  const beginNavigationCreate = (kind: Extract<LocalSpaceItemKind, 'folder' | 'list' | 'doc'>) => {
    if (!canEditSelectedSpace) { toast.info('This public Space is view-only.'); return; }
    setNavigationCreateKind(kind);
    setNavigationDescription('');
    setNavigationName('');
  };
  const submitNavigationCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = navigationName.trim();
    if (!nextName || !navigationCreateKind || !selectedLocalSpace) return;
    if (!canEditSelectedSpace) { toast.info('This public Space is view-only.'); return; }
    if (!navigationQuery.usesApi) {
      const nextItemId = localId(navigationCreateKind);
      const nextItem = {
        id: nextItemId,
        name: nextName,
        kind: navigationCreateKind,
        ...((navigationCreateKind === 'list' || navigationCreateKind === 'doc') && selectedFolder ? { parentId: selectedFolder.id } : {}),
        ...(navigationCreateKind === 'doc' ? { document: { content: '', updatedAt: new Date().toISOString() } } : {}),
      };
      const defaultList = navigationCreateKind === 'folder' ? { id: localId('list'), name: DEFAULT_FOLDER_LIST_NAME, kind: 'list' as const, parentId: nextItemId } : null;
      const nextSpaces = localSpaces.map((localSpace) => localSpace.id === selectedLocalSpace.id ? {
        ...localSpace,
        items: [...localSpace.items, nextItem, ...(defaultList ? [defaultList] : [])],
      } : localSpace);
      setLocalSpaces(nextSpaces);
      saveLocalSpaces(nextSpaces);
      setNavigationCreateKind(null);
      return;
    }
    try {
      if (navigationCreateKind === 'folder') {
        const project = await createProjectMutation.mutateAsync({ workspaceId: selectedLocalSpace.id, input: { name: nextName, description: navigationDescription.trim() || null } });
        await createSectionMutation.mutateAsync({ workspaceId: selectedLocalSpace.id, projectId: project.id, input: { name: DEFAULT_FOLDER_LIST_NAME } });
        await navigationQuery.refetch();
      } else if (navigationCreateKind === 'doc') {
        await createDocumentMutation.mutateAsync({ workspaceId: selectedLocalSpace.id, input: { title: nextName, projectId: selectedFolder?.id ?? null, content: '' } });
      } else if (selectedFolder) {
        await createSectionMutation.mutateAsync({ workspaceId: selectedLocalSpace.id, projectId: selectedFolder.id, input: { name: nextName } });
      } else await createRootSectionMutation.mutateAsync({ workspaceId: selectedLocalSpace.id, name: nextName });
      setNavigationCreateKind(null);
    } catch { toast.error('Unable to create this item.'); }
  };
  const createLocalListTask = async (input: { title: string; status: LocalTaskStatus; statusGroupId?: string }) => {
    const taskTargetList = selectedList ?? (visibleLocalLists.length === 1 ? visibleLocalLists[0] : undefined);
    if (!canEditSelectedSpace) {
      toast.info('This public Space is view-only.');
      return;
    }
    if (!selectedLocalSpace || !taskTargetList) {
      toast.info('Open a List before creating a Task.');
      return;
    }
    if (navigationQuery.usesApi) {
      const projectId = taskTargetList.apiProjectId ?? taskTargetList.parentId;
      if (!projectId || !input.statusGroupId) {
        toast.error('This List needs an API Project and status before creating Tasks.');
        return;
      }
      try {
        await createTaskMutation.mutateAsync({
          workspaceId: selectedLocalSpace.id,
          input: { projectId, sectionId: taskTargetList.id, statusId: input.statusGroupId, title: input.title, priority: 'NORMAL' }
        });
      } catch { toast.error('Unable to create the Task.'); }
      return;
    }
    const nextSpaces = localSpaces.map((localSpace) => localSpace.id === selectedLocalSpace.id ? {
      ...localSpace,
      items: localSpace.items.map((item) => item.id === taskTargetList.id ? {
        ...item,
        tasks: [...(item.tasks ?? []), ({ id: localId('task'), title: input.title, status: input.status, statusGroupId: input.statusGroupId, priority: 'Normal', assignee: '', startDate: '', dueDate: '', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], attachments: [], createdAt: new Date().toISOString() } satisfies LocalListTask)],
      } : item),
    } : localSpace);
    setLocalSpaces(nextSpaces);
    saveLocalSpaces(nextSpaces);
  };
  const updateLocalListTask = async (taskId: string, patch: Partial<Omit<import('../model/local-navigation').LocalListTask, 'id' | 'createdAt'>>) => {
    if (!selectedLocalSpace) return;
    if (!canEditSelectedSpace) { toast.info('This public Space is view-only.'); return; }
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
      if (patch.attachments) {
        const current = task.attachments ?? [];
        const added = patch.attachments.filter((attachment) => !current.some((item) => item.id === attachment.id));
        const removed = current.find((attachment) => !patch.attachments?.some((item) => item.id === attachment.id));
        try {
          if (added.length) {
            const uploadedAttachments: AttachmentContract[] = [];
            for (const attachment of added) {
              if (!attachment.dataUrl) continue;
              const blob = await fetch(attachment.dataUrl).then((response) => response.blob());
              const file = new File([blob], attachment.name, { type: attachment.mimeType });
              uploadedAttachments.push(await uploadAttachmentMutation.mutateAsync({ workspaceId: selectedLocalSpace.id, taskId, file }));
            }
            if (uploadedAttachments.length) {
              queryClient.setQueryData<{ items: TaskApiResponse[] }>(workspaceKeys.tasks(selectedLocalSpace.id, projectId), (current) => current ? ({
                ...current,
                items: current.items.map((item) => item.id === taskId ? ({ ...item, attachments: [...(item.attachments ?? []), ...uploadedAttachments] }) : item)
              }) : current);
            }
            toast.success(added.length === 1 ? 'Attachment uploaded.' : `${added.length} attachments uploaded.`);
          } else if (removed && !removed.id.startsWith('attachment-')) {
            await removeAttachmentMutation.mutateAsync({ workspaceId: selectedLocalSpace.id, attachmentId: removed.id });
            toast.success('Attachment removed.');
          }
        } catch {
          toast.error('Unable to update the attachment.');
        }
        return;
      }
      const input: import('@clickflow/contracts').TaskUpdateRequest = { version: task.version };
      if (patch.trackingStartedAt !== undefined) {
        try {
          if (patch.trackingStartedAt && !task.trackingStartedAt) {
            await startTimerMutation.mutateAsync({ workspaceId: selectedLocalSpace.id, taskId });
          } else if (patch.trackingStartedAt === null && task.trackingStartedAt) {
            await stopTimerMutation.mutateAsync({ workspaceId: selectedLocalSpace.id });
          }
        } catch { toast.error('Unable to update the timer.'); }
        return;
      }
      if (patch.title !== undefined) input.title = patch.title;
      if (patch.description !== undefined) input.description = patch.description || null;
      if (patch.statusGroupId !== undefined) input.statusId = patch.statusGroupId;
      if (patch.priority !== undefined) input.priority = ({ Urgent: 'URGENT', High: 'HIGH', Normal: 'NORMAL', Low: 'LOW' } as const)[patch.priority];
      if (patch.dueDate !== undefined) input.dueAt = patch.dueDate ? `${patch.dueDate}T00:00:00.000Z` : null;
      if (patch.timeEstimate !== undefined) {
        const match = patch.timeEstimate.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/);
        input.estimateMinutes = patch.timeEstimate ? Number(match?.[1] ?? 0) * 60 + Number(match?.[2] ?? 0) : null;
      }
      if (patch.tags !== undefined) {
        try { await syncTaskTagsMutation.mutateAsync({ workspaceId: selectedLocalSpace.id, projectId, taskId, tags: patch.tags, currentTags: task.tags ?? [] }); }
        catch { toast.error('Unable to update tags.'); }
        return;
      }
      if (patch.assigneeIds !== undefined) input.assigneeIds = patch.assigneeIds;
      else if (patch.assigneeId !== undefined) input.assigneeId = patch.assigneeId || null;
      else if (patch.assignee === '') input.assigneeId = null;
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
  const openAttachment = async (attachment: import('../model/local-navigation').LocalTaskAttachment): Promise<AttachmentPreviewData | null> => {
    const kind = attachment.mimeType.startsWith('image/') ? 'image' : attachment.mimeType.startsWith('video/') ? 'video' : attachment.mimeType === 'application/pdf' ? 'pdf' : (attachment.mimeType === 'text/plain' || attachment.mimeType === 'text/markdown') ? 'text' : 'file';
    if (attachment.dataUrl) {
      if (kind === 'text') {
        const response = await fetch(attachment.dataUrl);
        return { attachment, text: await response.text(), downloadUrl: attachment.dataUrl };
      }
      if (kind !== 'file') return { attachment, url: attachment.dataUrl, downloadUrl: attachment.dataUrl };
      window.open(attachment.dataUrl, '_blank', 'noopener,noreferrer');
      return null;
    }
    if (!selectedLocalSpace || attachment.id.startsWith('attachment-')) return null;
    try {
      const { downloadUrl } = await downloadAttachmentUrlMutation.mutateAsync({ workspaceId: selectedLocalSpace.id, attachmentId: attachment.id });
      if (kind === 'text') {
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error('Unable to load text preview.');
        return { attachment, text: await response.text(), downloadUrl };
      }
      if (kind === 'image' || kind === 'video' || kind === 'pdf') return { attachment, url: downloadUrl, downloadUrl };
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
      return null;
    } catch {
      toast.error('Unable to open the attachment.');
      return null;
    }
  };
  const deleteLocalListTasks = async (taskIds: string[]) => {
    if (!selectedLocalSpace || !selectedList || !taskIds.length) return;
    if (!canEditSelectedSpace) { toast.info('This public Space is view-only.'); return; }
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
  const createScopedStatus = async (input: { name: string; scope: LocalStatusScope; color: LocalStatusColor }) => {
    if (!selectedLocalSpace || !selectedList) return;
    if (!canEditSelectedSpace) { toast.info('This public Space is view-only.'); return; }
    if (navigationQuery.usesApi) {
      const projectId = selectedList.apiProjectId ?? selectedList.parentId;
      if (!projectId) return;
      try {
        const colors: Record<LocalStatusColor, string> = { slate: '#64748b', blue: '#3b82f6', indigo: '#6366f1', violet: '#8b5cf6', teal: '#14b8a6', emerald: '#10b981', amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', pink: '#ec4899' };
        await createStatusMutation.mutateAsync({ workspaceId: selectedLocalSpace.id, projectId, input: { name: input.name, color: colors[input.color], category: 'OPEN' } });
      } catch { toast.error('Unable to create the status.'); }
      return;
    }
    const group = { id: localId('status'), taskStatus: localId('status-value'), name: input.name, color: input.color, scope: input.scope };
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
    if (!canEditSelectedSpace) { toast.info('This public Space is view-only.'); return; }
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
  const deleteScopedStatus = async (input: { groupId: string; status: LocalTaskStatus; replacementGroupId?: string }) => {
    if (!selectedLocalSpace || !selectedList) return;
    if (!canEditSelectedSpace) { toast.info('This public Space is view-only.'); return; }
    if (navigationQuery.usesApi) {
      const projectId = selectedList.apiProjectId ?? selectedList.parentId;
      if (!projectId) return;
      try {
        await deleteStatusMutation.mutateAsync({ workspaceId: selectedLocalSpace.id, projectId, statusId: input.groupId, replacementStatusId: input.replacementGroupId });
        toast.success('Status deleted. Tasks were moved to Open.');
      } catch { toast.error('Unable to delete this status. Default statuses are protected.'); }
      return;
    }
    const nextSpaces = localSpaces.map((localSpace) => localSpace.id !== selectedLocalSpace.id ? localSpace : ({
      ...localSpace,
      statusGroups: (localSpace.statusGroups ?? []).filter((group) => group.id !== input.groupId),
      items: localSpace.items.map((item) => ({
        ...item,
        statusGroups: (item.statusGroups ?? []).filter((group) => group.id !== input.groupId),
        tasks: item.tasks?.map((task) => task.statusGroupId === input.groupId
          ? { ...task, statusGroupId: undefined, status: 'Backlog' }
          : task),
      })),
    }));
    setLocalSpaces(nextSpaces);
    saveLocalSpaces(nextSpaces);
  };
  const submitInviteMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const emails = parseInviteEmails(inviteEmail);
    if (!emails.length || !selectedLocalSpace) return;
    if (!navigationQuery.usesApi) {
      toast.info('Member invitations require an API-backed Space.');
      return;
    }
    try {
      await Promise.all(emails.map((email: string) => inviteMemberMutation.mutateAsync({ workspaceId: selectedLocalSpace.id, email })));
      setInviteEmail('');
      toast.success(emails.length === 1 ? 'Member invited to this Space.' : `${emails.length} members invited to this Space.`);
    } catch { toast.error('Unable to invite one or more members. Ask them to create an account first.'); }
  };
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !selectedLocalSpace) return;
    if (!canEditSelectedSpace) { toast.info('This public Space is view-only.'); return; }
    if (!navigationQuery.usesApi) {
      const nextFolderId = localId('folder');
      const nextSpaces = localSpaces.map((localSpace) => localSpace.id === selectedLocalSpace.id ? {
        ...localSpace,
        items: [
          ...localSpace.items,
          { id: nextFolderId, name: name.trim(), kind: 'folder' as const },
          { id: localId('list'), name: DEFAULT_FOLDER_LIST_NAME, kind: 'list' as const, parentId: nextFolderId },
        ],
      } : localSpace);
      setLocalSpaces(nextSpaces);
      saveLocalSpaces(nextSpaces);
      setName('');
      setDescription('');
      setCreating(false);
      return;
    }
    try {
      const project = await createProjectMutation.mutateAsync({ workspaceId: selectedLocalSpace.id, input: { name: name.trim(), description: description.trim() || null } });
      await createSectionMutation.mutateAsync({ workspaceId: selectedLocalSpace.id, projectId: project.id, input: { name: DEFAULT_FOLDER_LIST_NAME } });
      await navigationQuery.refetch();
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
      <div className="flex min-h-14 items-center justify-between gap-3 px-5"><div className="flex min-w-0 items-center gap-2 text-sm"><span className="grid h-4 w-4 shrink-0 place-items-center rounded bg-indigo-500 text-[9px] font-bold text-white">T</span><span className="truncate font-semibold">{title}</span><span className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:border-slate-700">{selectedLocalSpace?.private ? 'Private' : 'Public'}</span>{!selectedLocalSpace?.private && selectedLocalSpace?.publicAccess && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200">Can edit</span>}</div>{selectedLocalSpace && canShareSelectedSpace && <button type="button" onClick={() => setSharing(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"><Users size={16} />Share</button>}</div>{selectedLocalSpace && <div className="border-t border-slate-100 px-5 py-2 text-xs text-slate-500 dark:border-slate-900"><span>Created by {selectedLocalSpace.createdBy?.displayName ?? 'Unknown'}</span>{selectedLocalSpace.description && <span className="ml-2">{String.fromCharCode(0x00B7)} {selectedLocalSpace.description}</span>}</div>}
      <div role="tablist" aria-label="Space views" className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-4 dark:border-slate-900">{availableViews.map(({ name: view, icon: Icon, iconClassName }) => <button key={view} role="tab" aria-selected={displayedView === view} onClick={() => setActiveView(view)} className={`flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-3 text-sm ${displayedView === view ? 'border-slate-900 font-semibold dark:border-white' : 'border-transparent text-slate-500 hover:text-indigo-600'}`}><Icon aria-hidden="true" size={15} strokeWidth={2.2} className={`shrink-0 ${iconClassName}`} />{view}</button>)}<span className="flex shrink-0 items-center gap-1 px-3 py-3 text-sm text-slate-500"><Plus size={15} />View</span></div>
    </header>
{displayedView === 'Overview' && <div className="flex items-center justify-end gap-3 border-b border-slate-100 px-5 py-3 text-xs text-slate-500 dark:border-slate-900">
  <span role="status" className={`inline-flex items-center gap-1 ${navigationQuery.isError ? 'text-rose-600' : (isSaving || navigationQuery.isFetching ? 'text-blue-600' : 'text-emerald-600')}`}><RefreshCw aria-hidden="true" size={13} className={isSaving || navigationQuery.isFetching ? 'animate-spin' : ''} />{navigationQuery.isError ? 'Sync failed' : isSaving ? 'Saving changes...' : navigationQuery.isFetching ? 'Refreshing...' : 'All changes saved'}</span>
  <button type="button" aria-pressed={autoRefresh} onClick={() => setAutoRefresh((value) => !value)} className={`rounded-full border px-2 py-1 ${autoRefresh ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-200' : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-900'}`}>Auto refresh: {autoRefresh ? 'On' : 'Off'}</button>
  <div ref={overviewSettingsRef} className="relative"><button type="button" aria-label="Overview settings" aria-haspopup="menu" aria-expanded={overviewSettingsOpen} onClick={() => setOverviewSettingsOpen((value) => !value)} className="rounded border border-slate-200 p-1.5 hover:text-indigo-600 dark:border-slate-700"><Settings2 size={15} /></button>{overviewSettingsOpen && <div role="menu" aria-label="Overview refresh settings" className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900"><button type="button" role="menuitem" onClick={refreshOverview} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><RefreshCw size={14} />Refresh now</button><p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Refresh interval</p>{[15, 30, 60].map((seconds) => <button key={seconds} type="button" role="menuitemradio" aria-checked={refreshIntervalSeconds === seconds} onClick={() => setRefreshIntervalSeconds(seconds)} className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 ${refreshIntervalSeconds === seconds ? 'font-semibold text-indigo-600' : ''}`}>{seconds} seconds</button>)}</div>}</div>
</div>}
    {displayedView === 'Overview' ? <><section className="grid gap-4 p-4 lg:grid-cols-3"><article className="min-h-72 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><h2 className="text-sm font-semibold">Recent</h2><div className="mt-4 space-y-3">{recentLocalTasks.length ? recentLocalTasks.map(({ list, task }) => <button type="button" aria-label={task.title} onClick={() => setOverviewSelectedTaskId(task.id)} key={task.id} className="flex w-full items-center gap-3 text-left text-sm hover:text-indigo-600"><ListChecks size={16} className="shrink-0 text-slate-500" /><span className="truncate">{task.title} <span className="text-slate-400">{String.fromCharCode(0x00B7)} in {list.name}</span></span></button>) : <p className="text-sm text-slate-500">No recent tasks yet.</p>}</div></article><article className="min-h-72 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><h2 className="text-sm font-semibold">Docs</h2><div className="mt-4 space-y-3">{docs.length ? docs.map((doc) => <button type="button" key={doc.id} onClick={() => openDocument(doc)} className="flex w-full items-center gap-3 text-left text-sm hover:text-indigo-600"><FileText size={16} className="text-slate-500" /><span>{doc.name} <span className="text-slate-400">{String.fromCharCode(0x00B7)} in {selectedLocalSpace?.name}</span></span></button>) : <p className="text-sm text-slate-500">No Docs in this {selectedFolder ? 'Folder' : 'Space'} yet.</p>}</div></article><article className="flex min-h-72 flex-col rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><h2 className="text-sm font-semibold">Bookmarks</h2><div className="flex flex-1 flex-col items-center justify-center text-center"><Bookmark size={44} className="text-slate-300" /><p className="mt-4 max-w-xs text-sm text-slate-500">Save a Space, project, task, or useful link for quick access.</p>{bookmarked && <p className="mt-3 text-sm font-semibold text-indigo-600">Bookmark saved locally</p>}<Button size="sm" className="mt-4" onClick={() => setBookmarked((value) => !value)}>{bookmarked ? 'Bookmark saved' : 'Add Bookmark'}</Button></div></article></section>{selectedLocalSpace ? <section className="mx-4 mb-4 grid gap-4 xl:grid-cols-2"><TaskStatusChart tasks={visibleLocalTasks} statusGroups={scopedStatusGroups} statusOverrides={scopedStatusOverrides} /><TaskAssignmentChart tasks={visibleLocalTasks} /></section> : null}<section className="mx-4 mb-4 min-h-80 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold">{selectedFolder ? 'Lists' : 'Folders'}</h2><p className="mt-1 text-xs text-slate-500">{selectedFolder ? 'Lists in ' + selectedFolder.name : 'Folders in ' + selectedLocalSpace?.name}</p></div>{canEditSelectedSpace ? <Button size="sm" variant="ghost" onClick={() => beginNavigationCreate(selectedFolder ? 'list' : 'folder')}><Plus size={15} />New {selectedFolder ? 'list' : 'folder'}</Button> : <span className="text-xs font-medium text-slate-400">Limited access</span>}</div><div className="mt-4 flex flex-wrap gap-3">{selectedFolder ? (lists.length ? lists.map((list) => <button type="button" key={list.id} onClick={() => openList(list.id)} className="flex min-w-64 items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-left text-sm font-semibold transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:hover:bg-indigo-950/30"><ListChecks className="text-slate-500" size={20} />{list.name}</button>) : <p className="text-sm text-slate-500">No Lists in this Folder yet.</p>) : (folders.length ? folders.map((folder) => { const folderLists = selectedLocalSpace?.items.filter((item) => item.parentId === folder.id && item.kind === 'list') ?? []; return <button type="button" key={folder.id} onClick={() => openFolder(folder.id)} className="flex min-w-64 items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-left text-sm font-semibold transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:hover:bg-indigo-950/30"><Folder className="text-slate-500" size={20} />{folder.name}<span className="ml-auto text-xs font-normal text-slate-400">{folderLists.length} lists</span></button>; }) : <p className="text-sm text-slate-500">No folders in this Space yet.</p>)}</div></section></> : needsListForDisplayedView ? <ListRequiredEmptyState scope={selectedFolder ? 'folder' : 'space'} onCreate={beginNavigationCreate} /> : displayedView === 'Calendar' ? <LocalCalendarTaskSurface tasks={visibleLocalTasks} statusGroups={scopedStatusGroups} statusOverrides={scopedStatusOverrides} onUpdateTask={updateLocalListTask} /> : displayedView === 'Table' ? <LocalTableTaskSurface tasks={visibleLocalTasks} statusGroups={scopedStatusGroups} statusOverrides={scopedStatusOverrides} assignees={assignees} onUpdateTask={updateLocalListTask} /> : displayedView === 'Gantt' ? <LocalGanttTaskSurface tasks={visibleLocalTasks} statusGroups={scopedStatusGroups} statusOverrides={scopedStatusOverrides} onUpdateTask={updateLocalListTask} /> : (displayedView === 'Board' || displayedView === 'List') ? <LocalListTaskSurface view={displayedView} tasks={visibleLocalTasks} statusGroups={scopedStatusGroups} statusOverrides={scopedStatusOverrides} assignees={assignees} onCreateStatus={createScopedStatus} onUpdateStatus={updateScopedStatus} onDeleteStatus={deleteScopedStatus} onCreateTask={createLocalListTask} onUpdateTask={updateLocalListTask} onDeleteTasks={deleteLocalListTasks} onOpenAttachment={openAttachment} /> : <SpaceTabContent view={displayedView as Exclude<SpaceView, 'Overview'>} projects={projects} onOpenProject={selectProject} />}
    {overviewSelectedTask ? <LocalTaskDetailModal task={overviewSelectedTask} statusOptions={buildLocalTaskStatusOptions(scopedStatusGroups, scopedStatusOverrides)} assignees={assignees} onClose={() => setOverviewSelectedTaskId(null)} onUpdate={(patch) => updateLocalListTask(overviewSelectedTask.id, patch)} onOpenAttachment={openAttachment} /> : null}
    {selectedTask && <SpaceTaskModal project={selectedTask.project} task={selectedTask.task} onClose={closeTask} />}
    {selectedLocalSpace && canShareSelectedSpace && <Dialog open={sharing} onOpenChange={setSharing} contentClassName="max-w-lg p-0">
      <section className="overflow-hidden rounded-2xl bg-white dark:bg-slate-950"><header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800"><div><DialogTitle>Share this Space</DialogTitle><p className="mt-1 text-sm text-slate-500">Sharing {selectedLocalSpace?.name} with all views.</p></div><button type="button" aria-label="Close share dialog" onClick={() => setSharing(false)} className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"><X size={16} /></button></header><div className="space-y-5 p-5"><form onSubmit={submitInviteMember} className="flex gap-2 rounded-xl border border-slate-200 p-2 dark:border-slate-700"><input aria-label="Invite by name or email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="Invite by email" className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" /><Button size="sm" type="submit" disabled={inviteMemberMutation.isPending || !inviteEmail.trim() || !navigationQuery.usesApi}>{inviteMemberMutation.isPending ? 'Inviting...' : 'Invite'}</Button></form><div className="flex items-center justify-between text-sm"><span className="inline-flex items-center gap-2 font-medium"><Link2 size={16} />{selectedLocalSpace?.private ? 'Private' : 'Public'} link</span><Button size="sm" variant="outline" onClick={() => void navigator.clipboard?.writeText(window.location.href)}>Copy link</Button></div><div className="flex items-center justify-between text-sm"><span className="inline-flex items-center gap-2 font-medium"><Users size={16} />Default permission</span><span className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-sm dark:border-slate-700">Can edit</span></div><div className="border-t border-slate-100 pt-4 dark:border-slate-800"><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Share with</p><div className="space-y-2">{(membersQuery.data ?? selectedLocalSpace.members ?? []).map((member) => <div key={member.id} className="flex items-center gap-3 rounded-lg px-1 py-1.5"><span aria-hidden="true" style={member.avatarUrl ? { backgroundImage: `url("${member.avatarUrl}")` } : undefined} className="grid h-8 w-8 place-items-center rounded-full bg-indigo-500 bg-cover bg-center text-xs font-bold text-white">{member.avatarUrl ? '' : member.initials}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{member.displayName}</p><p className="text-xs text-slate-500">Space member</p></div><span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-200">{member.role === 'OWNER' ? 'Owner' : 'Can edit'}</span></div>)}{membersQuery.isLoading && <p role="status" className="text-sm text-slate-500">Loading members...</p>}{membersQuery.isError && <p role="alert" className="text-sm text-rose-600">Unable to load members.</p>}</div></div></div></section>
    </Dialog>}    <CreationDialog kind={navigationCreateKind ?? 'folder'} open={navigationCreateKind !== null} name={navigationName} description={navigationDescription} isPrivate={false} publicAccess="EDIT" invitees="" pending={createProjectMutation.isPending || createSectionMutation.isPending || createRootSectionMutation.isPending || createDocumentMutation.isPending} parentLabel={selectedFolder?.name ?? selectedLocalSpace?.name} onNameChange={setNavigationName} onDescriptionChange={setNavigationDescription} onPrivateChange={() => undefined} onPublicAccessChange={() => undefined} onInviteesChange={() => undefined} onOpenChange={(open) => { if (!open) setNavigationCreateKind(null); }} onSubmit={submitNavigationCreate} />    <Dialog open={creating} onOpenChange={setCreating}><form onSubmit={submit} className="space-y-4"><DialogTitle>Create a project</DialogTitle><label className="block text-sm font-medium">Project name<input aria-label="Project name" value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950" autoFocus /></label><label className="block text-sm font-medium">Description<textarea aria-label="Project description" value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950" /></label><div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button><Button type="submit" disabled={createProjectMutation.isPending}>Create project</Button></div></form></Dialog>
  </main>;
}




