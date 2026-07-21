'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Check, MoreHorizontal, CircleDashed, CircleDot, EyeOff, Flag, Layers3, Maximize2, FileText, ImagePlus, Link2, Minimize2, Paperclip, Plus, Search, Send, Smile, Sparkles, Tag, Timer, Trash2, UserRound, UserRoundCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { localId, type LocalListTask, type LocalStatusGroup, type LocalStatusScope, type LocalTaskAttachment, type LocalTaskComment, type LocalTaskPriority, type LocalTaskStatus } from '../model/local-navigation';
import { useAuthStore } from '@/features/auth/model/auth-store';

export type AssigneeOption = { userId: string; displayName: string; initials: string; avatarUrl: string | null; email?: string };

type LocalListTaskSurfaceProps = {
  view: 'Board' | 'List';
  tasks: LocalListTask[];
  statusGroups: LocalStatusGroup[];
  statusOverrides: import('../model/local-navigation').LocalStatusOverride[];
  assignees?: AssigneeOption[];
  onCreateStatus: (input: { name: string; scope: LocalStatusScope; color: import('../model/local-navigation').LocalStatusColor }) => void;
  onDeleteStatus: (input: { groupId: string; status: LocalTaskStatus; replacementGroupId?: string }) => void;
  onUpdateStatus: (input: { status: LocalTaskStatus; groupId?: string; name: string; color: import('../model/local-navigation').LocalStatusColor }) => void;
  onCreateTask: (input: { title: string; status: LocalTaskStatus; statusGroupId?: string }) => void;
  onUpdateTask: (taskId: string, patch: Partial<Omit<LocalListTask, 'id' | 'createdAt'>>) => void;
  onDeleteTasks: (taskIds: string[]) => void;
  onOpenAttachment?: (attachment: LocalTaskAttachment) => Promise<AttachmentPreviewData | null> | AttachmentPreviewData | null | void;
};

type TaskDetailPicker = 'status' | 'assignee' | 'dates' | 'priority' | 'estimate' | 'tags' | null;

type CommentDraft = { body: string; attachments: LocalTaskAttachment[]; links: string[]; };
type AttachmentKind = 'image' | 'video' | 'pdf' | 'text' | 'file';
export type AttachmentPreviewData = { attachment: LocalTaskAttachment; url?: string; text?: string; downloadUrl?: string };

const MOCK_COMMENT_AUTHOR = 'Khanh Tran';

export type LocalTaskStatusConfig = {
  status: LocalTaskStatus;
  label: string;
  icon: typeof CircleDashed;
  columnClassName: string;
  badgeClassName: string;
  isSystem?: boolean;
  taskIconClassName: string;
  groupId?: string;
  menuKey?: string;
};

type StatusConfig = LocalTaskStatusConfig;

const statuses: StatusConfig[] = [
  { status: 'Backlog', label: 'TO DO', icon: CircleDashed, columnClassName: 'bg-slate-100 dark:bg-slate-900', badgeClassName: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100', taskIconClassName: 'text-slate-400' },
  { status: 'In progress', label: 'IN PROGRESS', icon: CircleDot, columnClassName: 'bg-blue-50 dark:bg-blue-950/25', badgeClassName: 'bg-blue-500 text-white', taskIconClassName: 'text-blue-500' },
  { status: 'Done', label: 'COMPLETE', icon: CheckCircle2, columnClassName: 'bg-emerald-50 dark:bg-emerald-950/25', badgeClassName: 'bg-emerald-600 text-white', taskIconClassName: 'text-emerald-500' },
];

const statusColorClasses: Record<import('../model/local-navigation').LocalStatusColor, Pick<StatusConfig, 'columnClassName' | 'badgeClassName' | 'taskIconClassName'>> = {
  slate: { columnClassName: 'bg-slate-100 dark:bg-slate-900', badgeClassName: 'bg-slate-600 text-white', taskIconClassName: 'text-slate-400' }, blue: { columnClassName: 'bg-blue-50 dark:bg-blue-950/25', badgeClassName: 'bg-blue-500 text-white', taskIconClassName: 'text-blue-500' }, indigo: { columnClassName: 'bg-indigo-50 dark:bg-indigo-950/25', badgeClassName: 'bg-indigo-600 text-white', taskIconClassName: 'text-indigo-500' }, violet: { columnClassName: 'bg-violet-50 dark:bg-violet-950/25', badgeClassName: 'bg-violet-600 text-white', taskIconClassName: 'text-violet-500' }, teal: { columnClassName: 'bg-teal-50 dark:bg-teal-950/25', badgeClassName: 'bg-teal-600 text-white', taskIconClassName: 'text-teal-500' }, emerald: { columnClassName: 'bg-emerald-50 dark:bg-emerald-950/25', badgeClassName: 'bg-emerald-600 text-white', taskIconClassName: 'text-emerald-500' }, amber: { columnClassName: 'bg-amber-50 dark:bg-amber-950/25', badgeClassName: 'bg-amber-500 text-white', taskIconClassName: 'text-amber-500' }, orange: { columnClassName: 'bg-orange-50 dark:bg-orange-950/25', badgeClassName: 'bg-orange-500 text-white', taskIconClassName: 'text-orange-500' }, rose: { columnClassName: 'bg-rose-50 dark:bg-rose-950/25', badgeClassName: 'bg-rose-500 text-white', taskIconClassName: 'text-rose-500' }, pink: { columnClassName: 'bg-pink-50 dark:bg-pink-950/25', badgeClassName: 'bg-pink-500 text-white', taskIconClassName: 'text-pink-500' },
};
const statusColorSwatches: Record<import('../model/local-navigation').LocalStatusColor, string> = { slate: '#64748b', blue: '#3b82f6', indigo: '#6366f1', violet: '#8b5cf6', teal: '#14b8a6', emerald: '#10b981', amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', pink: '#ec4899' };
const statusOptionKey = (item: Pick<StatusConfig, 'status' | 'groupId'>) => item.groupId ? `group:${item.groupId}` : `default:${item.status}`;
const taskBelongsToStatus = (task: LocalListTask, item: Pick<StatusConfig, 'status' | 'groupId'>) => item.groupId ? task.statusGroupId === item.groupId : !task.statusGroupId && task.status === item.status;
export const isClosedStatusOption = (item: Pick<StatusConfig, 'label'>) => item.label.trim().toUpperCase() === 'COMPLETE';
export const buildLocalTaskStatusOptions = (statusGroups: LocalStatusGroup[], statusOverrides: import('../model/local-navigation').LocalStatusOverride[]): LocalTaskStatusConfig[] => {
  const includeLocalDefaults = !statusGroups.some((group) => group.source === 'api');
  const defaultOptions = includeLocalDefaults ? statuses.map((item) => {
    const override = statusOverrides.find((candidate) => candidate.status === item.status);
    return override ? { ...item, label: override.name.toUpperCase(), ...statusColorClasses[override.color] } : item;
  }) : [];
  return [...defaultOptions, ...statusGroups.map((group) => ({ status: group.taskStatus ?? group.name, label: group.name.toUpperCase(), icon: Layers3, groupId: group.id, isSystem: group.isSystem, ...statusColorClasses[group.color ?? 'indigo'] }))]
    .sort((left, right) => Number(isClosedStatusOption(left)) - Number(isClosedStatusOption(right)));
};
function usePickerDismissal(open: boolean, onOpenChange: (open: boolean) => void) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !popoverRef.current?.contains(event.target)) onOpenChange(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open, onOpenChange]);

  return popoverRef;
}
function InlineTaskComposer({ title, statusLabel, compact = false, onTitleChange, onSubmit, onCancel }: { title: string; statusLabel: string; compact?: boolean; onTitleChange: (value: string) => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  const quickActions = [
    { label: 'Task type', icon: Layers3 },
    { label: 'AI assist', icon: Sparkles },
    { label: 'Set assignee', icon: UserRound },
    { label: 'Set due date', icon: CalendarDays },
    { label: 'Set priority', icon: Flag },
    { label: 'Add tags', icon: Tag },
  ];
  return <form aria-label={`Add task to ${statusLabel}`} onSubmit={onSubmit} className={compact ? 'mt-2 space-y-2 rounded-xl border border-indigo-200 bg-white p-2 shadow-sm dark:border-indigo-900 dark:bg-slate-950' : 'grid grid-cols-[2rem_minmax(220px,1fr)_auto] items-center gap-3 border-b border-indigo-200 bg-indigo-50/35 px-5 py-2.5 dark:border-indigo-950 dark:bg-indigo-950/10'}>
    <CircleDashed aria-hidden="true" size={16} className="text-slate-400" />
    <input autoFocus aria-label="Task name" value={title} onChange={(event) => onTitleChange(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') onCancel(); }} placeholder="Task Name or type '/' for commands" className="min-w-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white" />
    <div className={`flex items-center ${compact ? 'justify-end gap-1 border-t border-slate-100 pt-2 dark:border-slate-800' : 'gap-1'}`}>
      {!compact && quickActions.map(({ label, icon: Icon }) => <button key={label} type="button" aria-label={label} title={`${label} after saving`} disabled className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-400 disabled:cursor-not-allowed dark:border-slate-700"><Icon aria-hidden="true" size={15} /></button>)}
      <button type="button" aria-label="Cancel task creation" onClick={onCancel} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"><X aria-hidden="true" size={15} /></button>
      <button type="submit" aria-label="Save task" disabled={!title.trim()} className="inline-flex h-8 items-center gap-1 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">Save <span aria-hidden="true">↵</span></button>
    </div>
  </form>;
}
export function LocalListTaskSurface({ view, tasks, statusGroups, statusOverrides, assignees = [], onCreateStatus, onUpdateStatus, onDeleteStatus, onCreateTask, onUpdateTask, onDeleteTasks, onOpenAttachment }: LocalListTaskSurfaceProps) {
  const currentUser = useAuthStore((state) => state.user);
  const [hideClosed, setHideClosed] = useState(false);
  const [assignedToMeOnly, setAssignedToMeOnly] = useState(false);
  const [selectedStatusKeys, setSelectedStatusKeys] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<LocalTaskStatus>('Backlog');
  const [statusGroupId, setStatusGroupId] = useState<string | undefined>();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [collapsedStatusKeys, setCollapsedStatusKeys] = useState<string[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [statusDeleteTarget, setStatusDeleteTarget] = useState<{ groupId: string; status: LocalTaskStatus; label: string } | null>(null);
  const [deleteTasksOpen, setDeleteTasksOpen] = useState(false);
  const [creatingStatus, setCreatingStatus] = useState(false);
  const [statusName, setStatusName] = useState('');
  const [statusScope, setStatusScope] = useState<LocalStatusScope>('list');
  const [optionsStatus, setOptionsStatus] = useState<StatusConfig | null>(null);
  const [statusCreateColor, setStatusCreateColor] = useState<import('../model/local-navigation').LocalStatusColor>('indigo');
  useEffect(() => {
    const closeOnOutside = (event: PointerEvent) => { if (!(event.target instanceof Element) || !event.target.closest('[data-status-options]')) setOptionsStatus(null); };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOptionsStatus(null); };
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('pointerdown', closeOnOutside); document.removeEventListener('keydown', closeOnEscape); };
  }, []);
  const [editingStatus, setEditingStatus] = useState<StatusConfig | null>(null);
  const [statusEditName, setStatusEditName] = useState('');
  const [statusEditColor, setStatusEditColor] = useState<import('../model/local-navigation').LocalStatusColor>('indigo');
  const statusOptions = buildLocalTaskStatusOptions(statusGroups, statusOverrides);
  const visibleStatusOptions = statusOptions.filter((option) => {
    if (hideClosed && isClosedStatusOption(option)) return false;
    return !selectedStatusKeys.length || selectedStatusKeys.includes(statusOptionKey(option));
  });
  const visibleTasks = tasks.filter((task) => {
    const option = statusOptions.find((candidate) => taskBelongsToStatus(task, candidate));
    if (hideClosed && option && isClosedStatusOption(option)) return false;
    if (!assignedToMeOnly) return true;
    if (task.assigneeId) return task.assigneeId === currentUser?.id;
    const assignee = task.assignee.trim().toLowerCase();
    const displayName = currentUser?.displayName.trim().toLowerCase() ?? '';
    return Boolean(assignee && displayName && (assignee === displayName || assignee.split(/\s+/)[0] === displayName.split(/\s+/)[0]));
  });
  const openStatusCreate = () => { setStatusName(''); setStatusScope('list'); setStatusCreateColor('indigo'); setCreatingStatus(true); };
  const openStatusEdit = (item: StatusConfig) => { setOptionsStatus(null); setEditingStatus(item); setStatusEditName(item.label); setStatusEditColor((statusGroups.find((group) => group.id === item.groupId)?.color ?? statusOverrides.find((override) => override.status === item.status)?.color ?? 'indigo')); };
  const submitStatusEdit = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!editingStatus || !statusEditName.trim()) return; onUpdateStatus({ status: editingStatus.status, groupId: editingStatus.groupId, name: statusEditName.trim(), color: statusEditColor }); setEditingStatus(null); };
  const submitStatus = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const nextName = statusName.trim(); if (!nextName) return; onCreateStatus({ name: nextName, scope: statusScope, color: statusCreateColor }); setCreatingStatus(false); };
  const isSystemStatus = (groupId?: string) => !groupId || statusGroups.find((group) => group.id === groupId)?.isSystem === true;
  const deleteStatus = (groupId: string | undefined, status: LocalTaskStatus) => { setOptionsStatus(null); if (isSystemStatus(groupId) || !groupId) return; const label = statusGroups.find((group) => group.id === groupId)?.name ?? String(status); setStatusDeleteTarget({ groupId, status, label }); };
  const confirmStatusDelete = () => { if (!statusDeleteTarget) return; const replacement = statusGroups.find((group) => group.isSystem && group.name === 'Open'); onDeleteStatus({ groupId: statusDeleteTarget.groupId, status: statusDeleteTarget.status, replacementGroupId: replacement?.id }); setStatusDeleteTarget(null); };
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;
  const toggleStatusCollapse = (statusKey: string) => setCollapsedStatusKeys((current) => current.includes(statusKey) ? current.filter((key) => key !== statusKey) : [...current, statusKey]);
  const toggleTaskSelection = (taskId: string) => setSelectedTaskIds((current) => current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId]);
  const toggleStatusSelection = (taskIds: string[]) => setSelectedTaskIds((current) => taskIds.length > 0 && taskIds.every((taskId) => current.includes(taskId)) ? current.filter((id) => !taskIds.includes(id)) : [...new Set([...current, ...taskIds])]);
  const deleteSelectedTasks = () => { if (!selectedTaskIds.length) return; setDeleteTasksOpen(true); };
  const confirmSelectedTaskDelete = () => { onDeleteTasks(selectedTaskIds); setSelectedTaskIds([]); setDeleteTasksOpen(false); };

  const openCreate = (nextStatus: LocalTaskStatus = 'Backlog', nextStatusGroupId?: string) => { setStatus(nextStatus); setStatusGroupId(nextStatusGroupId); setTitle(''); setCreating(true); };
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle) return;
    onCreateTask({ title: nextTitle, status, statusGroupId });
    setCreating(false);
  };

  return <>
    {view === 'Board' ? <section>
      <h2 className="sr-only">Space Board</h2><ListToolbar statusOptions={statusOptions} selectedStatusKeys={selectedStatusKeys} onSelectedStatusKeysChange={setSelectedStatusKeys} hideClosed={hideClosed} assignedToMeOnly={assignedToMeOnly} onToggleClosed={() => setHideClosed((value) => !value)} onToggleAssigned={() => setAssignedToMeOnly((value) => !value)} />
      <div className="flex min-h-[520px] items-start gap-2 overflow-x-auto p-4">
        {visibleStatusOptions.map(({ status: statusValue, label, icon: StatusIcon, columnClassName, badgeClassName, taskIconClassName, groupId }) => {
          const statusTasks = visibleTasks.filter((task) => taskBelongsToStatus(task, { status: statusValue, groupId }));
          const isCreatingHere = creating && status === statusValue && statusGroupId === groupId;
          return <article key={groupId ?? statusValue} aria-label={`${label} column`} className={`w-60 shrink-0 self-start rounded-xl p-2 2xl:w-64 ${columnClassName}`}>
            <header className="relative flex min-h-8 items-center gap-2 px-1"><span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${badgeClassName}`}><StatusIcon aria-hidden="true" size={13} />{label}</span><span className="text-xs text-slate-500 dark:text-slate-400">{statusTasks.length}</span><button type="button" aria-label={`Status options ${label}`} onClick={() => setOptionsStatus(optionsStatus?.menuKey === (groupId ?? `default-${statusValue}`) ? null : { status: statusValue, label, icon: StatusIcon, columnClassName, badgeClassName, taskIconClassName, groupId, menuKey: groupId ?? `default-${statusValue}` })} className="ml-auto grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-white/80 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"><MoreHorizontal aria-hidden="true" size={16} /></button>{optionsStatus?.menuKey === (groupId ?? `default-${statusValue}`) && <div data-status-options role="menu" className="absolute right-1 top-8 z-30 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900"><p className="px-2 py-1.5 text-xs font-medium text-slate-500">Group options</p><button type="button" role="menuitem" aria-label="Rename status" onClick={() => openStatusEdit({ status: statusValue, label, icon: StatusIcon, columnClassName, badgeClassName, taskIconClassName, groupId, menuKey: groupId ?? `default-${statusValue}` })} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><Tag size={15} />Rename</button><button type="button" role="menuitem" onClick={() => openStatusEdit({ status: statusValue, label, icon: StatusIcon, columnClassName, badgeClassName, taskIconClassName, groupId, menuKey: groupId ?? `default-${statusValue}` })} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><CircleDot size={15} />Edit status</button>{groupId && !isSystemStatus(groupId) ? <button type="button" role="menuitem" aria-label={`Delete status ${label}`} onClick={() => deleteStatus(groupId, statusValue)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"><Trash2 size={15} />Delete status</button> : <p className="px-2 py-2 text-xs text-slate-400">Default status cannot be deleted</p>}</div>}</header>
            <div className="mt-2 space-y-2">{statusTasks.map((task) => <button type="button" key={task.id} aria-label={task.title} onClick={() => setSelectedTaskId(task.id)} className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/90"><span className="flex items-start gap-2"><StatusIcon aria-hidden="true" size={16} className={`mt-0.5 shrink-0 ${taskIconClassName}`} /><span className="text-sm font-semibold leading-5 text-slate-900 dark:text-slate-100">{task.title}</span></span></button>)}</div>
            {isCreatingHere ? <InlineTaskComposer compact title={title} statusLabel={label} onTitleChange={setTitle} onSubmit={submit} onCancel={() => setCreating(false)} /> : <button type="button" aria-label={`Add task in ${label}`} onClick={() => openCreate(statusValue, groupId)} className="mt-2 flex w-full items-center gap-1 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-500 hover:bg-white/80 hover:text-indigo-600 dark:hover:bg-slate-800"><Plus aria-hidden="true" size={16} />Add Task</button>}
          </article>;
        })}
        <button type="button" aria-label="Add group" onClick={openStatusCreate} className="mt-1 inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-3 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-900 dark:hover:text-white"><Plus aria-hidden="true" size={16} />Add group</button>
      </div>
    </section> : <section className="pb-8">
      <h2 className="sr-only">Space List</h2><ListToolbar statusOptions={statusOptions} selectedStatusKeys={selectedStatusKeys} onSelectedStatusKeysChange={setSelectedStatusKeys} hideClosed={hideClosed} assignedToMeOnly={assignedToMeOnly} onToggleClosed={() => setHideClosed((value) => !value)} onToggleAssigned={() => setAssignedToMeOnly((value) => !value)} />
      <div className="space-y-5 px-5 pt-5">
        {visibleStatusOptions.map(({ status: statusValue, label, icon: StatusIcon, badgeClassName, taskIconClassName, groupId }) => {
          const statusTasks = visibleTasks.filter((task) => taskBelongsToStatus(task, { status: statusValue, groupId }));
          const isCreatingHere = creating && status === statusValue && statusGroupId === groupId;
          const statusKey = statusOptionKey({ status: statusValue, groupId });
          const isCollapsed = collapsedStatusKeys.includes(statusKey);
          const areAllStatusTasksSelected = statusTasks.length > 0 && statusTasks.every((task) => selectedTaskIds.includes(task.id));
          return <section key={statusKey}><header className="relative flex items-center gap-2"><button type="button" aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${label}`} aria-expanded={!isCollapsed} onClick={() => toggleStatusCollapse(statusKey)} className="grid h-7 w-7 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"><ChevronDown aria-hidden="true" size={15} className={isCollapsed ? '-rotate-90 transition-transform' : 'transition-transform'} /></button><span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${badgeClassName}`}><StatusIcon aria-hidden="true" size={13} />{label}</span><span className="text-xs text-slate-500">{statusTasks.length}</span><button type="button" aria-label={`Status options ${label}`} onClick={() => setOptionsStatus(optionsStatus?.menuKey === statusKey ? null : { status: statusValue, label, icon: StatusIcon, columnClassName: '', badgeClassName, taskIconClassName, groupId, menuKey: statusKey })} className="grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"><MoreHorizontal aria-hidden="true" size={16} /></button>{optionsStatus?.menuKey === statusKey && <div data-status-options role="menu" className="absolute left-5 top-8 z-30 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900"><p className="px-2 py-1.5 text-xs font-medium text-slate-500">Group options</p><button type="button" role="menuitem" aria-label="Rename status" onClick={() => openStatusEdit({ status: statusValue, label, icon: StatusIcon, columnClassName: '', badgeClassName, taskIconClassName, groupId, menuKey: statusKey })} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><Tag size={15} />Rename</button><button type="button" role="menuitem" onClick={() => openStatusEdit({ status: statusValue, label, icon: StatusIcon, columnClassName: '', badgeClassName, taskIconClassName, groupId, menuKey: statusKey })} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><CircleDot size={15} />Edit status</button>{groupId && !isSystemStatus(groupId) ? <button type="button" role="menuitem" aria-label={`Delete status ${label}`} onClick={() => deleteStatus(groupId, statusValue)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"><Trash2 size={15} />Delete status</button> : <p className="px-2 py-2 text-xs text-slate-400">Default status cannot be deleted</p>}</div>}</header>{!isCollapsed && <><div className="mt-3 grid grid-cols-[2rem_minmax(220px,1fr)_9rem_10rem_8rem_8rem_2rem] items-center gap-3 border-b border-slate-100 px-5 py-2 text-xs font-medium text-slate-500 dark:border-slate-900"><input type="checkbox" aria-label={`Select all tasks in ${label}`} checked={areAllStatusTasksSelected} disabled={!statusTasks.length} onChange={() => toggleStatusSelection(statusTasks.map((task) => task.id))} className="h-4 w-4 rounded border-slate-300 accent-indigo-600 disabled:cursor-not-allowed" /><span>Name</span><span>Assignee</span><span>Due date</span><span>Priority</span><span>Comments</span><button type="button" aria-label={`Add field to ${label}`} className="justify-self-end rounded p-1"><Plus size={15} /></button></div>{statusTasks.map((task) => <div key={task.id} className={`grid grid-cols-[2rem_minmax(220px,1fr)_9rem_10rem_8rem_8rem_2rem] items-center gap-3 border-b border-slate-100 px-5 py-3 text-sm transition dark:border-slate-900 ${selectedTaskIds.includes(task.id) ? 'bg-indigo-50/80 dark:bg-indigo-950/35' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}><input type="checkbox" aria-label={`Select task ${task.title}`} checked={selectedTaskIds.includes(task.id)} onChange={() => toggleTaskSelection(task.id)} className="h-4 w-4 rounded border-slate-300 accent-indigo-600" /><button type="button" aria-label={task.title} onClick={() => setSelectedTaskId(task.id)} className="flex min-w-0 items-center gap-3 text-left"><StatusIcon aria-hidden="true" size={16} className={taskIconClassName} /><span className="truncate font-medium">{task.title}</span></button><span>{task.assignee}</span><span>{task.dueDate}</span><span>{task.priority}</span><span>{task.comments?.length ?? 0}</span></div>)}{isCreatingHere ? <InlineTaskComposer title={title} statusLabel={label} onTitleChange={setTitle} onSubmit={submit} onCancel={() => setCreating(false)} /> : <button type="button" aria-label={`Add task in ${label}`} onClick={() => openCreate(statusValue, groupId)} className="flex w-full items-center gap-3 border-b border-slate-100 px-5 py-3 text-left text-sm text-slate-500 hover:text-indigo-600 dark:border-slate-900"><Plus aria-hidden="true" size={16} />Add Task</button>}</>}</section>;
        })}
        <button type="button" onClick={openStatusCreate} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600"><Plus size={16} />New status</button>
      </div>
    </section>}
    {selectedTaskIds.length > 0 && <div role="toolbar" aria-label="Bulk task actions" className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-900"><span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold dark:bg-slate-800">{selectedTaskIds.length} {selectedTaskIds.length === 1 ? 'task' : 'tasks'} selected</span><button type="button" onClick={() => setSelectedTaskIds([])} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Clear selection</button><span className="h-6 w-px bg-slate-200 dark:bg-slate-700" /><button type="button" aria-label="Delete selected tasks" onClick={deleteSelectedTasks} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"><Trash2 aria-hidden="true" size={16} />Delete</button></div>}    <DeleteConfirmationDialog open={statusDeleteTarget !== null} title="Delete status?" itemName={statusDeleteTarget?.label ?? ''} description="Tasks using this status will be moved to Open before the custom status is removed." confirmLabel="Delete status" onOpenChange={(open) => { if (!open) setStatusDeleteTarget(null); }} onConfirm={confirmStatusDelete} />
    <DeleteConfirmationDialog open={deleteTasksOpen} title="Delete selected tasks?" itemName={`${selectedTaskIds.length} ${selectedTaskIds.length === 1 ? 'task' : 'tasks'}`} description="The selected tasks will be archived and removed from active views." confirmLabel="Delete tasks" onOpenChange={setDeleteTasksOpen} onConfirm={confirmSelectedTaskDelete} />
    <Dialog open={creatingStatus} onOpenChange={setCreatingStatus}><form onSubmit={submitStatus} className="space-y-4"><DialogTitle>Create status</DialogTitle><label className="block text-sm font-medium">Status name<input aria-label="Status name" value={statusName} onChange={(event) => setStatusName(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950" autoFocus /></label><fieldset><legend className="text-sm font-medium">Color</legend><div className="mt-2 flex flex-wrap gap-2">{(Object.keys(statusColorSwatches) as Array<import('../model/local-navigation').LocalStatusColor>).map((color) => <button key={color} type="button" aria-label={`New status color ${color}`} aria-pressed={statusCreateColor === color} onClick={() => setStatusCreateColor(color)} style={{ backgroundColor: statusColorSwatches[color] }} className={`h-7 w-7 rounded-full border-2 ${statusCreateColor === color ? 'border-slate-900 ring-2 ring-indigo-300 dark:border-white' : 'border-white dark:border-slate-700'}`} />)}</div></fieldset><fieldset><legend className="text-sm font-medium">Apply status to</legend><div className="mt-2 space-y-2">{([{ value: 'list', label: 'List only', description: 'Only visible in this List.' }, { value: 'folder', label: 'Folder only', description: 'Visible across Lists in this Folder.' }, { value: 'space', label: 'Entire Space', description: 'Visible across all Lists in this Space.' }] as const).map((option) => <label key={option.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${statusScope === option.value ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' : 'border-slate-200 dark:border-slate-700'}`}><input type="radio" name="status-scope" value={option.value} checked={statusScope === option.value} onChange={() => setStatusScope(option.value)} /><span><span className="block text-sm font-semibold">{option.label}</span><span className="block text-xs text-slate-500">{option.description}</span></span></label>)}</div></fieldset><div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setCreatingStatus(false)}>Cancel</Button><Button type="submit">Create status</Button></div></form></Dialog>
    <Dialog open={editingStatus !== null} onOpenChange={(open) => { if (!open) setEditingStatus(null); }}><form onSubmit={submitStatusEdit} className="space-y-4"><DialogTitle>Edit status</DialogTitle><label className="block text-sm font-medium">Status name<input aria-label="Status name" value={statusEditName} onChange={(event) => setStatusEditName(event.target.value)} className="mt-2 w-full rounded-lg border border-indigo-400 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 dark:border-indigo-500 dark:bg-slate-950" autoFocus /></label><fieldset><legend className="text-sm font-medium">Color</legend><div className="mt-2 flex flex-wrap gap-2">{(Object.keys(statusColorSwatches) as Array<import('../model/local-navigation').LocalStatusColor>).map((color) => <button key={color} type="button" aria-label={`Status color ${color}`} aria-pressed={statusEditColor === color} onClick={() => setStatusEditColor(color)} style={{ backgroundColor: statusColorSwatches[color] }} className={`h-6 w-6 rounded-full border-2 ${statusEditColor === color ? 'border-slate-900 ring-2 ring-indigo-300 dark:border-white' : 'border-white dark:border-slate-700'}`} />)}</div></fieldset><div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setEditingStatus(null)}>Cancel</Button><Button type="submit">Save status</Button></div></form></Dialog>    {selectedTask && <LocalTaskDetailModal task={selectedTask} statusOptions={statusOptions} assignees={assignees} onClose={() => setSelectedTaskId(null)} onUpdate={(patch) => onUpdateTask(selectedTask.id, patch)} onOpenAttachment={onOpenAttachment} />}
  </>;
}

export function LocalTaskDetailModal({ task, statusOptions, assignees = [], onClose, onUpdate, onOpenAttachment }: { task: LocalListTask; statusOptions: LocalTaskStatusConfig[]; assignees?: AssigneeOption[]; onClose: () => void; onUpdate: (patch: Partial<Omit<LocalListTask, 'id' | 'createdAt'>>) => void; onOpenAttachment?: (attachment: LocalTaskAttachment) => Promise<AttachmentPreviewData | null> | AttachmentPreviewData | null | void }) {
  const [fullscreen, setFullscreen] = useState(false);
  const [activityWidth, setActivityWidth] = useState(360);
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentPreviewData | null>(null);
  const [activePicker, setActivePicker] = useState<TaskDetailPicker>(null);
  const activityItems = [
    ...(task.activity ?? []).filter((activity) => activity.eventType !== 'TASK_CREATED' && !activity.eventType.startsWith('COMMENT_')).map((activity) => ({ kind: 'activity' as const, item: activity })),
    ...(task.comments ?? []).map((comment) => ({ kind: 'comment' as const, item: comment })),
  ].sort((left, right) => new Date(left.item.createdAt).getTime() - new Date(right.item.createdAt).getTime());
  const attachments = task.attachments ?? [];

  const postComment = ({ body, attachments: commentAttachments, links }: CommentDraft) => {
    const trimmedBody = body.trim();
    if (!trimmedBody && !commentAttachments.length && !links.length) return;
    onUpdate({ comments: [...(task.comments ?? []), { id: localId('comment'), body: trimmedBody, attachments: commentAttachments, links, authorName: MOCK_COMMENT_AUTHOR, createdAt: new Date().toISOString() }] });
  };
  const addAttachments = async (files: File[]) => {
    const created = await Promise.all(files.map(readAttachmentFile));
    if (created.length) onUpdate({ attachments: [...attachments, ...created] });
  };
  const removeAttachment = (attachmentId: string) => onUpdate({ attachments: attachments.filter((attachment) => attachment.id !== attachmentId) });
  const openAttachmentPreview = async (attachment: LocalTaskAttachment) => {
    const kind = attachmentKind(attachment);
    if (attachment.dataUrl && canPreviewAttachment(attachment)) {
      if (kind === 'text') {
        setPreviewAttachment({ attachment, text: await readTextPreview(attachment.dataUrl), downloadUrl: attachment.dataUrl });
        return;
      }
      setPreviewAttachment({ attachment, url: attachment.dataUrl, downloadUrl: attachment.dataUrl });
      return;
    }
    const resolved = await onOpenAttachment?.(attachment);
    if (resolved) setPreviewAttachment(resolved);
  };
  const beginActivityResize = (event: React.PointerEvent<HTMLDivElement>) => {
    const startX = event.clientX;
    const startWidth = activityWidth;
    const onMove = (moveEvent: PointerEvent) => setActivityWidth(Math.max(280, Math.min(600, startWidth - (moveEvent.clientX - startX))));
    const onEnd = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onEnd); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
  };
  const toggleTracking = () => {
    if (!task.trackingStartedAt) {
      onUpdate({ trackingStartedAt: new Date().toISOString() });
      return;
    }
    const elapsedSeconds = Math.max(0, Math.round((Date.now() - new Date(task.trackingStartedAt).getTime()) / 1000));
    onUpdate({ trackingStartedAt: null, trackedSeconds: (task.trackedSeconds ?? 0) + elapsedSeconds });
  };  return <div className="fixed inset-y-0 left-0 right-0 z-[100] md:left-[76px]" role="presentation"><button aria-label="Close task detail" className="absolute inset-0 h-full w-full cursor-default bg-slate-950/35 backdrop-blur-[1px]" onClick={onClose} /><section role="dialog" aria-modal="true" aria-labelledby="local-task-detail-title" className={'absolute grid overflow-hidden border border-slate-200 bg-white shadow-2xl shadow-slate-950/30 dark:border-slate-700 dark:bg-slate-950 ' + (fullscreen ? 'inset-0 rounded-none' : 'inset-y-[2.5vh] left-[1.25vw] right-[1.25vw] rounded-2xl')}><div className="grid min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_8px_var(--activity-panel-width)]" style={{ '--activity-panel-width': `${activityWidth}px` } as CSSProperties}><main className="min-h-0 overflow-y-auto px-7 py-6 sm:px-10 sm:py-8"><header className="flex items-center justify-between gap-4 text-xs text-slate-500"><span className="inline-flex items-center gap-1.5"><Layers3 size={14} />Local task</span><div className="flex items-center gap-1"><button type="button" aria-label={fullscreen ? 'Exit full screen' : 'Enter full screen'} aria-pressed={fullscreen} onClick={() => setFullscreen((value) => !value)} className="rounded-md p-2 hover:bg-slate-100 dark:hover:bg-slate-800">{fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button><button type="button" aria-label="Close task detail" onClick={onClose} className="rounded-md p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={17} /></button></div></header><div className="mt-6 inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><CircleDot size={11} />Task</div><input id="local-task-detail-title" aria-label="Task title" value={task.title} onChange={(event) => onUpdate({ title: event.target.value })} className="mt-3 w-full rounded-lg border border-transparent bg-transparent px-1 py-1 text-3xl font-bold leading-tight text-slate-900 outline-none focus:border-slate-200 focus:bg-white dark:text-white dark:focus:border-slate-700 dark:focus:bg-slate-900" /><div className="mt-6 grid gap-x-14 gap-y-4 border-b border-slate-200 pb-7 text-sm sm:grid-cols-2 dark:border-slate-800"><div className="grid grid-cols-[9.5rem_1fr] items-center gap-3"><span className="inline-flex items-center gap-2 text-slate-500"><CircleDot size={16} />Status</span><StatusPicker value={task.status} statusGroupId={task.statusGroupId} options={statusOptions} onChange={onUpdate} open={activePicker === 'status'} onOpenChange={(open) => setActivePicker(open ? 'status' : null)} /></div><div className="grid grid-cols-[9.5rem_1fr] items-center gap-3"><span className="inline-flex items-center gap-2 text-slate-500"><UserRound size={16} />Assignees</span><AssigneePicker value={task.assignee ?? ''} assigneeId={task.assigneeId ?? null} assigneeIds={task.assigneeIds} selectedAssignees={task.assignees} assignees={assignees} onChange={(assignee) => onUpdate(assignee)} open={activePicker === 'assignee'} onOpenChange={(open) => setActivePicker(open ? 'assignee' : null)} /></div><div className="grid grid-cols-[9.5rem_1fr] items-center gap-3"><span className="inline-flex items-center gap-2 text-slate-500"><CalendarDays size={16} />Dates</span><DatesPicker startDate={task.startDate ?? ''} dueDate={task.dueDate ?? ''} onChange={(patch) => onUpdate(patch)} open={activePicker === 'dates'} onOpenChange={(open) => setActivePicker(open ? 'dates' : null)} /></div><div className="grid grid-cols-[9.5rem_1fr] items-center gap-3"><span className="inline-flex items-center gap-2 text-slate-500"><Flag size={16} />Priority</span><PriorityPicker value={task.priority ?? 'Normal'} onChange={(priority) => onUpdate({ priority })} open={activePicker === 'priority'} onOpenChange={(open) => setActivePicker(open ? 'priority' : null)} /></div><div className="grid grid-cols-[9.5rem_1fr] items-center gap-3"><span className="inline-flex items-center gap-2 text-slate-500"><Timer size={16} />Time estimate</span><TimeEstimatePicker value={task.timeEstimate ?? ''} onChange={(timeEstimate) => onUpdate({ timeEstimate })} open={activePicker === 'estimate'} onOpenChange={(open) => setActivePicker(open ? 'estimate' : null)} /></div><div className="grid grid-cols-[9.5rem_1fr] items-center gap-3"><span className="inline-flex items-center gap-2 text-slate-500"><Timer size={16} />Track time</span><button type="button" aria-label="Track time" onClick={toggleTracking} className="inline-flex w-fit items-center gap-1 text-slate-500 hover:text-indigo-500"><CircleDot size={16} className={task.trackingStartedAt ? 'fill-rose-500 text-rose-500' : ''} />{task.trackingStartedAt ? 'Stop' : (task.trackedSeconds ?? 0) > 0 ? `${Math.floor((task.trackedSeconds ?? 0) / 60)}m logged` : 'Start'}</button></div><div className="grid grid-cols-[9.5rem_1fr] items-center gap-3"><span className="inline-flex items-center gap-2 text-slate-500"><Tag size={16} />Tags</span><TagsPicker value={task.tags ?? []} onChange={(tags) => onUpdate({ tags })} open={activePicker === 'tags'} onOpenChange={(open) => setActivePicker(open ? 'tags' : null)} /></div></div><label className="mt-5 block"><span className="text-sm text-slate-500">Description</span><textarea aria-label="Description" value={task.description ?? ''} onChange={(event) => onUpdate({ description: event.target.value })} placeholder="Add more details for this task..." className="mt-2 min-h-32 w-full resize-y rounded-lg border border-transparent bg-transparent px-2 py-2 text-sm outline-none hover:border-slate-200 focus:border-indigo-400 focus:bg-slate-50 dark:hover:border-slate-800 dark:focus:bg-slate-900" /></label><TaskAttachmentSection attachments={attachments} onAdd={addAttachments} onRemove={removeAttachment} onPreview={openAttachmentPreview} /></main><div role="separator" aria-label="Resize activity panel" aria-orientation="vertical" onPointerDown={beginActivityResize} className="hidden cursor-col-resize touch-none border-x border-slate-200 bg-slate-50 transition hover:bg-indigo-100 lg:block dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-indigo-950" /><aside className="flex min-h-0 flex-col border-t border-slate-200 bg-slate-50/90 p-5 lg:border-t-0 dark:border-slate-800 dark:bg-slate-900/50"><h3 className="font-semibold">Activity</h3><div className="mt-4 flex-1 space-y-1 overflow-y-auto text-sm"><div className="grid grid-cols-[0.5rem_minmax(0,1fr)_auto] items-start gap-2 rounded-md px-1 py-2 text-slate-500"><span aria-hidden="true">•</span><span>You created this task</span><time className="shrink-0 text-xs text-slate-400" dateTime={task.createdAt}>{formatActivityTime(task.createdAt)}</time></div>{activityItems.map(({ kind, item }) => kind === 'comment' ? <CommentActivityItem key={`comment-${item.id}`} item={item} /> : <SystemActivityItem key={`activity-${item.id}`} item={item} />)}</div><CommentComposer onSend={postComment} /></aside></div></section>{previewAttachment && <AttachmentPreview preview={previewAttachment} onClose={() => setPreviewAttachment(null)} />}</div>;
}

function readAttachmentFile(file: File): Promise<LocalTaskAttachment> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ id: localId('attachment'), name: file.name, mimeType: inferAttachmentMimeType(file), size: file.size, dataUrl: typeof reader.result === 'string' ? reader.result : '', createdAt: new Date().toISOString() });
    reader.onerror = () => resolve({ id: localId('attachment'), name: file.name, mimeType: inferAttachmentMimeType(file), size: file.size, dataUrl: '', createdAt: new Date().toISOString() });
    reader.readAsDataURL(file);
  });
}

function inferAttachmentMimeType(file: File): string {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (file.type) return file.type;
  if (extension === 'md' || extension === 'markdown') return 'text/markdown';
  if (extension === 'txt' || extension === 'csv' || extension === 'log') return 'text/plain';
  if (extension === 'pdf') return 'application/pdf';
  return 'application/octet-stream';
}

function attachmentKind(attachment: LocalTaskAttachment): AttachmentKind {
  if (attachment.mimeType.startsWith('image/')) return 'image';
  if (attachment.mimeType.startsWith('video/')) return 'video';
  if (attachment.mimeType === 'application/pdf') return 'pdf';
  if (attachment.mimeType === 'text/plain' || attachment.mimeType === 'text/markdown') return 'text';
  return 'file';
}

function canPreviewAttachment(attachment: LocalTaskAttachment): boolean {
  return attachmentKind(attachment) !== 'file';
}

function attachmentKindLabel(kind: AttachmentKind): string {
  if (kind === 'pdf') return 'PDF';
  if (kind === 'text') return 'TEXT';
  return kind.toUpperCase();
}

async function readTextPreview(url: string): Promise<string> {
  const response = await fetch(url);
  return response.text();
}

function TaskAttachmentSection({ attachments, onAdd, onRemove, onPreview }: { attachments: LocalTaskAttachment[]; onAdd: (files: File[]) => void; onRemove: (attachmentId: string) => void; onPreview: (attachment: LocalTaskAttachment) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const addFiles = (files: FileList | null) => {
    const selected = Array.from(files ?? []);
    if (selected.length) onAdd(selected);
  };

  return <section className="mt-7 border-t border-slate-200 pt-6 dark:border-slate-800" aria-labelledby="task-attachments-title">
    <div className="flex items-center gap-2"><Paperclip aria-hidden="true" size={16} className="text-indigo-500" /><h3 id="task-attachments-title" className="text-sm font-semibold">Attachments {attachments.length ? <span className="text-slate-400">{attachments.length}</span> : null}</h3></div>
    <input id="task-attachment-input" aria-label="Add attachment" type="file" multiple className="sr-only" onChange={(event) => { addFiles(event.currentTarget.files); event.currentTarget.value = ''; }} />
    <label htmlFor="task-attachment-input" onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(event) => { event.preventDefault(); setIsDragging(false); addFiles(event.dataTransfer.files); }} className={`mt-3 flex cursor-pointer items-center justify-center rounded-xl border border-dashed px-4 py-4 text-sm transition ${isDragging ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-200' : 'border-slate-300 text-slate-500 hover:border-indigo-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900'}`}>Drop files here or <span className="ml-1 font-semibold text-indigo-600">browse</span></label>
    {attachments.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{attachments.map((attachment) => {
      const kind = attachmentKind(attachment);
      const canPreview = canPreviewAttachment(attachment);
      return <article key={attachment.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900"><button type="button" aria-label={`${canPreview ? 'Preview' : 'Open'} attachment ${attachment.name}`} onClick={() => onPreview(attachment)} className="block h-24 w-full overflow-hidden rounded-lg bg-white text-left outline-none ring-indigo-500 focus:ring-2 dark:bg-slate-950">{kind === 'image' && attachment.dataUrl ? <Image src={attachment.dataUrl} alt="" width={240} height={160} unoptimized className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]" /> : kind === 'video' && attachment.dataUrl ? <video src={attachment.dataUrl} muted className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center"><FileText aria-hidden="true" size={26} className="text-indigo-500" /></span>}</button><p className="mt-2 truncate text-xs font-medium" title={attachment.name}>{attachment.name}</p><p className="mt-0.5 text-[11px] text-slate-400">{attachmentKindLabel(kind)} {String.fromCharCode(0x00B7)} {Math.max(1, Math.ceil(attachment.size / 1024))} KB</p><button type="button" aria-label={`Remove attachment ${attachment.name}`} onClick={() => onRemove(attachment.id)} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md bg-slate-950/70 text-white opacity-0 transition hover:bg-rose-600 group-hover:opacity-100 focus:opacity-100"><X aria-hidden="true" size={14} /></button></article>;
    })}</div>}
  </section>;
}

function AttachmentPreview({ preview, onClose }: { preview: AttachmentPreviewData; onClose: () => void }) {
  const { attachment } = preview;
  const kind = attachmentKind(attachment);
  const previewUrl = preview.url ?? attachment.dataUrl;
  const openUrl = preview.downloadUrl ?? previewUrl;
  return <div className="fixed inset-0 z-[120] grid place-items-center p-4" role="presentation"><button type="button" aria-label="Close attachment preview" onClick={onClose} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" /><section role="dialog" aria-modal="true" aria-label="Attachment preview" className="relative flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-950 shadow-2xl"><header className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3 text-sm text-white"><span className="min-w-0 truncate font-semibold">{attachment.name}</span><div className="flex shrink-0 items-center gap-2">{openUrl ? <a href={openUrl} target="_blank" rel="noreferrer" className="rounded-md px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white">Open original</a> : null}<button type="button" aria-label="Close attachment preview" onClick={onClose} className="rounded-md p-2 text-slate-300 hover:bg-white/10 hover:text-white"><X size={18} /></button></div></header><div className="grid min-h-0 flex-1 place-items-center bg-black/40 p-6">{kind === 'video' && previewUrl ? <video src={previewUrl} controls className="max-h-[78vh] max-w-full" /> : kind === 'image' && previewUrl ? <Image src={previewUrl} alt={attachment.name} width={1200} height={800} unoptimized className="max-h-[78vh] w-auto max-w-full object-contain" /> : kind === 'pdf' && previewUrl ? <iframe title={attachment.name} src={previewUrl} className="h-[78vh] w-full rounded-lg bg-white" /> : kind === 'text' ? <pre className="max-h-[78vh] w-full overflow-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-5 text-left text-sm leading-6 text-slate-100">{preview.text ?? 'Unable to load preview.'}</pre> : <div className="max-w-md text-center text-sm text-slate-300"><FileText className="mx-auto mb-3 text-indigo-400" size={40} /><p>This file type cannot be previewed here.</p>{openUrl ? <a href={openUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500">Open file</a> : null}</div>}</div></section></div>;
}
function formatActivityTime(value: string): string {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (elapsedSeconds < 60) return 'Just now';
  const minutes = Math.floor(elapsedSeconds / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'}`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
}
export function formatSystemActivityMessage(item: NonNullable<LocalListTask['activity']>[number]): string {
  const from = typeof item.metadata.statusFrom === 'string' ? item.metadata.statusFrom : null;
  const to = typeof item.metadata.statusTo === 'string' ? item.metadata.statusTo : null;
  if (from && to) return 'changed status from ' + from.toUpperCase() + ' to ' + to.toUpperCase();
  const fields = Array.isArray(item.metadata.changedFields) ? item.metadata.changedFields.filter((field): field is string => typeof field === 'string') : [];
  if (fields.includes('statusId')) return 'changed status';
  if (fields.some((field) => field === 'assigneeId' || field === 'assigneeIds')) return 'changed assignees';
  const labels: Record<string, string> = { title: 'title', description: 'description', priority: 'priority', dueAt: 'due date', sectionId: 'section', parentTaskId: 'parent task' };
  const changed = fields.map((field) => labels[field]).filter(Boolean);
  if (changed.length) return 'changed ' + changed.join(', ');
  return item.eventType.replace(/^TASK_/, '').replaceAll('_', ' ').toLowerCase();
}
function SystemActivityItem({ item }: { item: NonNullable<LocalListTask['activity']>[number] }) {
  const message = formatSystemActivityMessage(item);
  return <div className="grid grid-cols-[0.5rem_minmax(0,1fr)_auto] items-start gap-2 rounded-md px-1 py-2 text-slate-500"><span aria-hidden="true">•</span><span><strong className="font-medium text-slate-700 dark:text-slate-300">{item.actorName}</strong> {message}</span><time className="shrink-0 text-xs text-slate-400" dateTime={item.createdAt}>{formatActivityTime(item.createdAt)}</time></div>;
}
function CommentActivityItem({ item }: { item: LocalTaskComment }) {
  const attachments = item.attachments ?? [];
  const links = item.links ?? [];
  const authorName = item.authorName ?? MOCK_COMMENT_AUTHOR;
  const initials = authorName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
  return <article className="my-3 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><div className="p-4"><header className="flex items-center gap-2"><span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">{initials}</span><strong className="min-w-0 truncate text-sm">{authorName}</strong><time className="shrink-0 text-xs text-slate-400" dateTime={item.createdAt}>{formatActivityTime(item.createdAt)}</time></header>{item.body && <p className="mt-4 whitespace-pre-wrap break-words text-sm">{item.body}</p>}{attachments.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{attachments.map((attachment) => <span key={attachment.id} className="inline-flex max-w-40 items-center gap-1 rounded bg-slate-100 px-1.5 py-1 text-xs dark:bg-slate-800"><FileText size={12} /><span className="truncate">{attachment.name}</span></span>)}</div>}{links.length > 0 && <div className="mt-2">{links.map((link) => <a key={link} href={link} target="_blank" rel="noreferrer" className="block truncate text-xs text-indigo-500 hover:underline">{link}</a>)}</div>}</div><footer className="flex items-center gap-4 border-t border-slate-200 px-4 py-2.5 text-xs text-slate-400 dark:border-slate-700"><button type="button" aria-label="Like comment" className="hover:text-indigo-500">Like</button><button type="button" aria-label="React to comment" className="hover:text-indigo-500">React</button><button type="button" className="ml-auto font-medium hover:text-indigo-500">Reply</button></footer></article>;
}function CommentComposer({ onSend }: { onSend: (draft: CommentDraft) => void }) {
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<LocalTaskAttachment[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [linkDraft, setLinkDraft] = useState('');
  const [linkEditorOpen, setLinkEditorOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const emojiOptions = [0x1F600, 0x1F44D, 0x1F525, 0x1F389, 0x1F60D, 0x1F602, 0x1F914, 0x1F680, 0x2705, 0x1F4A1, 0x1F44F, 0x1F64C].map((codePoint) => String.fromCodePoint(codePoint));
  const addFiles = (files: FileList | null) => Array.from(files ?? []).forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => setAttachments((current) => [...current, { id: localId('comment-file'), name: file.name, mimeType: inferAttachmentMimeType(file), size: file.size, dataUrl: typeof reader.result === 'string' ? reader.result : '', createdAt: new Date().toISOString() }]);
    reader.readAsDataURL(file);
  });
  const attachLink = () => {
    const link = linkDraft.trim();
    if (!link || links.includes(link)) return;
    setLinks((current) => [...current, link]);
    setLinkDraft('');
    setLinkEditorOpen(false);
  };
  const send = () => {
    if (!body.trim() && !attachments.length && !links.length) return;
    onSend({ body, attachments, links });
    setBody('');
    setAttachments([]);
    setLinks([]);
    setLinkDraft('');
    setLinkEditorOpen(false);
  };

  return <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800"><div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950">{(attachments.length > 0 || links.length > 0) && <div className="flex flex-wrap gap-2 px-3 pt-3">{attachments.map((attachment) => <span key={attachment.id} className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800"><FileText aria-hidden="true" size={13} className="shrink-0 text-indigo-500" /><span className="max-w-32 truncate">{attachment.name}</span><button type="button" aria-label={`Remove comment attachment ${attachment.name}`} onClick={() => setAttachments((current) => current.filter((item) => item.id !== attachment.id))} className="rounded p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700"><X aria-hidden="true" size={12} /></button></span>)}{links.map((link) => <span key={link} className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-indigo-50 px-2 py-1 text-xs text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200"><Link2 aria-hidden="true" size={13} className="shrink-0" /><span className="max-w-32 truncate">{link}</span><button type="button" aria-label={`Remove link ${link}`} onClick={() => setLinks((current) => current.filter((item) => item !== link))} className="rounded p-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-900"><X aria-hidden="true" size={12} /></button></span>)}</div>}<textarea aria-label="Comment" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write a comment..." className="min-h-28 w-full resize-none bg-transparent px-3 py-3 text-sm outline-none" />{linkEditorOpen && <div className="mx-3 mb-3 flex gap-2"><input aria-label="Comment link" value={linkDraft} onChange={(event) => setLinkDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); attachLink(); } }} placeholder="Paste a link..." className="min-w-0 flex-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900" /><button type="button" onClick={attachLink} className="rounded-md bg-indigo-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-600">Attach link</button></div>}<div className="flex items-center justify-between border-t border-slate-100 px-2 py-2 dark:border-slate-800"><div className="flex items-center gap-1"><input id="comment-file-input" aria-label="Attach file to comment" type="file" multiple className="sr-only" onChange={(event) => { addFiles(event.currentTarget.files); event.currentTarget.value = ''; }} /><label htmlFor="comment-file-input" title="Attach file" className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"><Paperclip aria-hidden="true" size={16} /></label><input id="comment-image-input" aria-label="Attach image to comment" type="file" accept="image/*" multiple className="sr-only" onChange={(event) => { addFiles(event.currentTarget.files); event.currentTarget.value = ''; }} /><label htmlFor="comment-image-input" title="Attach image" className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"><ImagePlus aria-hidden="true" size={16} /></label><button type="button" aria-label="Add link to comment" title="Add link" onClick={() => setLinkEditorOpen((value) => !value)} className="grid h-8 w-8 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"><Link2 aria-hidden="true" size={16} /></button><div className="relative"><button type="button" aria-label="Add emoji to comment" title="Add emoji" aria-expanded={emojiPickerOpen} onClick={() => setEmojiPickerOpen((value) => !value)} className="grid h-8 w-8 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"><Smile aria-hidden="true" size={16} /></button>{emojiPickerOpen && <div role="dialog" aria-label="Emoji picker" className="absolute bottom-[calc(100%+0.5rem)] left-0 z-30 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900"><p className="mb-2 text-xs font-semibold text-slate-500">Frequently used</p><div className="grid grid-cols-6 gap-1">{emojiOptions.map((emoji) => <button key={emoji} type="button" aria-label={'Add ' + emoji + ' emoji'} onClick={() => { setBody((current) => current + emoji); setEmojiPickerOpen(false); }} className="grid h-8 place-items-center rounded-md text-lg transition hover:bg-slate-100 dark:hover:bg-slate-800">{emoji}</button>)}</div></div>}</div></div><button type="button" aria-label="Send comment" title="Send comment" disabled={!body.trim() && !attachments.length && !links.length} onClick={send} className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white shadow-sm transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"><Send aria-hidden="true" size={15} /></button></div></div></div>;
}
export function StatusPicker({ value, statusGroupId, options, onChange, open, onOpenChange, triggerLabel }: { value: LocalTaskStatus; statusGroupId?: string; options: StatusConfig[]; onChange: (patch: Pick<LocalListTask, 'status' | 'statusGroupId'>) => void; open: boolean; onOpenChange: (open: boolean) => void; triggerLabel?: string }) {
  const popoverRef = usePickerDismissal(open, onOpenChange);
  const [query, setQuery] = useState('');
  const selected = options.find((item) => item.groupId === statusGroupId && item.status === value) ?? options.find((item) => !item.groupId && item.status === value) ?? options[0];
  const groups = [
    { name: 'Not started', items: options.filter((item) => !item.groupId && item.status === 'Backlog') },
    { name: 'Active', items: options.filter((item) => !item.groupId && item.status === 'In progress') },
    { name: 'Closed', items: options.filter((item) => !item.groupId && item.status === 'Done') },
    { name: 'Custom', items: options.filter((item) => Boolean(item.groupId)) },
  ];
  const normalizedQuery = query.trim().toLowerCase();

  return <div ref={popoverRef} className="relative w-fit"><button type="button" aria-label={triggerLabel} aria-haspopup="listbox" aria-expanded={open} onClick={() => { onOpenChange(!open); setQuery(''); }} className={`inline-flex min-w-28 items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs font-bold text-white outline-none ring-indigo-400 focus:ring-2 ${selected.badgeClassName}`}>{selected.label}<ChevronDown aria-hidden="true" size={14} /></button>{open && <div role="listbox" aria-label="Task status choices" className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900"><label className="sr-only" htmlFor="task-status-search">Search statuses</label><div className="flex items-center gap-2 rounded-md border border-indigo-400 px-2 py-1.5"><Search aria-hidden="true" size={14} className="text-slate-400" /><input id="task-status-search" autoFocus placeholder="Search statuses" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></div><div className="mt-2 space-y-3">{groups.map((group) => { const items = group.items.filter((item) => !normalizedQuery || item.label.toLowerCase().includes(normalizedQuery)); if (!items.length) return null; return <section key={group.name}><p className="px-2 text-xs font-medium text-slate-500">{group.name}</p><div className="mt-1 space-y-0.5">{items.map((item) => { const Icon = item.icon; const active = item.status === value && item.groupId === statusGroupId; return <button key={statusOptionKey(item)} type="button" role="option" aria-selected={active} onClick={() => { onChange({ status: item.status, statusGroupId: item.groupId }); onOpenChange(false); }} className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs font-semibold transition ${active ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/70'}`}><Icon aria-hidden="true" size={15} className={item.taskIconClassName} /><span className="flex-1">{item.label}</span>{active && <Check aria-hidden="true" size={15} />}</button>; })}</div></section>; })}</div></div>}</div>;
}export function AssigneePicker({ assigneeId, assigneeIds, selectedAssignees = [], assignees, onChange, open, onOpenChange }: { value: string; assigneeId?: string | null; assigneeIds?: string[]; selectedAssignees?: Array<{ id: string; displayName: string; initials: string; avatarUrl: string | null }>; assignees: AssigneeOption[]; onChange: (patch: Pick<LocalListTask, 'assignee' | 'assigneeId' | 'assigneeIds' | 'assignees'>) => void; open: boolean; onOpenChange: (open: boolean) => void }) {
  const popoverRef = usePickerDismissal(open, onOpenChange);
  const currentUser = useAuthStore((state) => state.user);
  const [query, setQuery] = useState('');
  const fallbackAssignees: AssigneeOption[] = currentUser ? [{ userId: currentUser.id, displayName: currentUser.displayName, initials: currentUser.displayName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'Me', avatarUrl: currentUser.avatarUrl ?? null, email: currentUser.email }] : [];
  const people = [...(assignees.length ? assignees : fallbackAssignees)].sort((left, right) => {
    if (left.userId === currentUser?.id) return -1;
    if (right.userId === currentUser?.id) return 1;
    return left.displayName.localeCompare(right.displayName);
  });
  const activeIds = assigneeIds ?? (assigneeId ? [assigneeId] : []);
  const selected = selectedAssignees.length ? selectedAssignees : people.filter((person) => activeIds.includes(person.userId)).map((person) => ({ id: person.userId, displayName: person.displayName, initials: person.initials, avatarUrl: person.avatarUrl }));
  const filteredPeople = people.filter((person) => !query.trim() || person.displayName.toLowerCase().includes(query.trim().toLowerCase()) || person.email?.toLowerCase().includes(query.trim().toLowerCase()));
  const commit = (ids: string[]) => {
    const profiles = people.filter((person) => ids.includes(person.userId)).map((person) => ({ id: person.userId, displayName: person.displayName, initials: person.initials, avatarUrl: person.avatarUrl }));
    onChange({ assigneeIds: ids, assignees: profiles, assigneeId: ids[0] ?? null, assignee: profiles[0]?.displayName ?? '' });
  };
  return <div ref={popoverRef} className="relative w-full max-w-xs"><div className="flex min-h-8 flex-wrap items-center gap-2">{selected.map((person) => <span key={person.id} className="inline-flex h-9 max-w-56 items-center gap-2 rounded-lg bg-slate-100 px-2 text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-100"><span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-500 bg-cover bg-center text-[10px] font-bold text-white" style={person.avatarUrl ? { backgroundImage: `url("${person.avatarUrl}")` } : undefined}>{person.avatarUrl ? '' : person.initials}</span><span className="truncate">{currentUser?.id === person.id ? 'Me' : person.displayName}</span><button type="button" aria-label={`Unassign ${person.displayName}`} title={`Unassign ${person.displayName}`} onClick={() => commit(activeIds.filter((id) => id !== person.id))} className="ml-auto grid h-6 w-6 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-white"><X aria-hidden="true" size={14} /></button></span>)}<button type="button" aria-label="Edit assignee" onClick={() => { onOpenChange(!open); setQuery(''); }} className="ml-2 grid h-8 w-8 place-items-center rounded-full border border-dashed border-slate-500 text-slate-500 hover:border-indigo-500 hover:text-indigo-500"><Plus size={15} /></button></div>{open && <div role="listbox" aria-label="Task assignees" aria-multiselectable="true" className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"><div className="p-3"><div className="flex items-center gap-2 rounded-md border border-indigo-400 px-2 py-1.5"><Search size={14} className="text-slate-400" /><input autoFocus aria-label="Search assignees" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></div></div><div className="border-t border-slate-100 px-3 py-2 dark:border-slate-800"><p className="text-xs font-medium text-slate-500">People</p>{filteredPeople.map((person) => { const active = activeIds.includes(person.userId); return <button key={person.userId} type="button" role="option" aria-selected={active} onClick={() => commit(active ? activeIds.filter((id) => id !== person.userId) : [...activeIds, person.userId])} className="mt-2 flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><span style={person.avatarUrl ? { backgroundImage: `url("${person.avatarUrl}")` } : undefined} className="grid h-7 w-7 place-items-center rounded-full bg-violet-500 bg-cover bg-center text-[10px] font-bold text-white">{person.avatarUrl ? '' : person.initials}</span><span className="min-w-0 flex-1 truncate">{currentUser?.id === person.userId ? 'Me' : person.displayName}</span>{active && <Check size={14} />}</button>; })}</div></div>}</div>;
}export function DatesPicker({ startDate, dueDate, onChange, open, onOpenChange }: { startDate: string; dueDate: string; onChange: (patch: Pick<LocalListTask, 'startDate' | 'dueDate'>) => void; open: boolean; onOpenChange: (open: boolean) => void }) {
  const popoverRef = usePickerDismissal(open, onOpenChange);
  const [activeField, setActiveField] = useState<'startDate' | 'dueDate'>('dueDate');
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const toIso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const [today] = useState(() => new Date());
  const formatDate = (value: string) => value ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(new Date(`${value}T00:00:00`)) : '';
  const dateRangeSeparator = String.fromCharCode(0x2192);
  const dateRange = startDate || dueDate ? (formatDate(startDate) || 'Start') + ' ' + dateRangeSeparator + ' ' + (formatDate(dueDate) || 'Due') : 'Start ' + dateRangeSeparator + ' Due';
  const applyDate = (value: string) => onChange({ startDate, dueDate, [activeField]: value });
  const applyOffset = (days: number) => { const date = new Date(); date.setDate(date.getDate() + days); onChange({ startDate, dueDate: toIso(date) }); setActiveField('dueDate'); };
  const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();
  const totalDays = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({ length: firstDay + totalDays }, (_, index) => index < firstDay ? null : index - firstDay + 1);
  const selectCalendarDay = (day: number) => applyDate(toIso(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day)));
  return <div ref={popoverRef} className="relative w-full max-w-xs"><button type="button" aria-label="Edit dates" onClick={() => onOpenChange(!open)} className="w-full rounded-md px-2 py-1 text-left text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">{dateRange}</button>{open && <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20 grid w-[32rem] grid-cols-[13rem_1fr] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"><div className="border-r border-slate-100 p-3 dark:border-slate-800"><div className="space-y-2">{([['startDate', 'Start date', startDate], ['dueDate', 'Due date', dueDate]] as const).map(([field, label, value]) => <button type="button" key={field} onClick={() => setActiveField(field)} className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm ${activeField === field ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}><CalendarDays size={14} />{value ? formatDate(value) : label}</button>)}</div><div className="mt-3 space-y-1">{[['Today', 0], ['Tomorrow', 1], ['This weekend', 2], ['Next week', 7], ['Next weekend', 10], ['2 weeks', 14], ['4 weeks', 28]].map(([label, days]) => <button key={label} type="button" onClick={() => applyOffset(days as number)} className="flex w-full justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><span>{label}</span><span className="text-xs text-slate-400">{formatDate(toIso(new Date(today.getTime() + (days as number) * 86400000)))}</span></button>)}</div></div><div className="p-4"><div className="flex items-center justify-between"><button type="button" aria-label="Previous month" onClick={() => setCalendarDate((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))} className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronLeft size={16} /></button><span className="text-sm font-semibold">{calendarDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</span><button type="button" aria-label="Next month" onClick={() => setCalendarDate((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))} className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronRight size={16} /></button></div><div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-slate-400">{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day}>{day}</span>)}</div><div className="mt-2 grid grid-cols-7 gap-1">{calendarDays.map((day, index) => day ? <button type="button" key={day} onClick={() => selectCalendarDay(day)} className={`grid h-8 place-items-center rounded-full text-xs hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-950 ${toIso(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day)) === (activeField === 'startDate' ? startDate : dueDate) ? 'bg-indigo-500 font-semibold text-white hover:bg-indigo-600 hover:text-white' : ''}`}>{day}</button> : <span key={`blank-${index}`} />)}</div></div></div>}</div>;
}
export function PriorityPicker({ value, onChange, open, onOpenChange }: { value: LocalTaskPriority; onChange: (priority: LocalTaskPriority) => void; open: boolean; onOpenChange: (open: boolean) => void }) {
  const popoverRef = usePickerDismissal(open, onOpenChange);
  const options: Array<{ value: LocalTaskPriority; className: string }> = [{ value: 'Urgent', className: 'text-rose-500' }, { value: 'High', className: 'text-amber-500' }, { value: 'Normal', className: 'text-blue-500' }, { value: 'Low', className: 'text-slate-400' }];
  const selected = options.find((item) => item.value === value) ?? options[2];
  return <div ref={popoverRef} className="relative w-fit"><button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => onOpenChange(!open)} className="inline-flex min-w-24 items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"><Flag aria-hidden="true" size={15} className={selected.className} />{selected.value}<ChevronDown aria-hidden="true" size={14} /></button>{open && <div role="listbox" aria-label="Task priority choices" className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900"><p className="px-2 py-1 text-xs font-medium text-slate-500">Priority</p><div className="space-y-0.5">{options.map((item) => <button key={item.value} type="button" role="option" aria-selected={item.value === value} onClick={() => { onChange(item.value); onOpenChange(false); }} className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition ${item.value === value ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/70'}`}><Flag aria-hidden="true" size={15} className={item.className} /><span>{item.value}</span>{item.value === value && <Check aria-hidden="true" size={15} className="ml-auto" />}</button>)}</div></div>}</div>;
}

function TimeEstimatePicker({ value, onChange, open, onOpenChange }: { value: string; onChange: (value: string) => void; open: boolean; onOpenChange: (open: boolean) => void }) {
  const popoverRef = usePickerDismissal(open, onOpenChange);
  const [draft, setDraft] = useState('');
  const openPicker = () => { const match = value.match(/(\d+)h(?:\s*(\d+)m)?/); setDraft(match ? String(Number(match[1]) + Number(match[2] ?? 0) / 60) : ''); onOpenChange(true); };
  const save = () => { const hours = Number(draft); if (!Number.isFinite(hours) || hours <= 0) { onChange(''); onOpenChange(false); return; } const minutes = Math.round(hours * 60); const formatted = `${Math.floor(minutes / 60)}h ${minutes % 60}m`; onChange(formatted); onOpenChange(false); };
  const previewMinutes = Number.isFinite(Number(draft)) ? Math.round(Number(draft) * 60) : 0;
  return <div ref={popoverRef} className="relative w-full max-w-xs"><button type="button" aria-label="Edit time estimate" onClick={openPicker} className="w-full rounded-md px-2 py-1 text-left text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">{value || 'Empty'}</button>{open && <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900"><label className="flex items-center justify-between gap-3 text-sm font-semibold">Time estimate<input aria-label="Estimate hours" inputMode="decimal" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="1.5" className="w-28 rounded-md border border-slate-200 px-2 py-1.5 text-sm font-normal outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950" /></label><p className="mt-3 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">{previewMinutes ? `${Math.floor(previewMinutes / 60)} hour${Math.floor(previewMinutes / 60) === 1 ? '' : 's'} ${previewMinutes % 60} minutes` : 'Enter hours as a decimal'}</p><div className="mt-3 flex justify-end gap-2"><Button type="button" size="sm" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="button" size="sm" onClick={save}>Save estimate</Button></div></div>}</div>;
}

function TagsPicker({ value, onChange, open, onOpenChange }: { value: string[]; onChange: (tags: string[]) => void; open: boolean; onOpenChange: (open: boolean) => void }) {
  const popoverRef = usePickerDismissal(open, onOpenChange);
  const [draft, setDraft] = useState('');
  const createTag = () => { const tag = draft.trim(); if (!tag) return; onChange(value.includes(tag) ? value : [...value, tag]); setDraft(''); };
  return <div ref={popoverRef} className="relative w-full max-w-xs"><button type="button" aria-label="Edit tags" onClick={() => onOpenChange(!open)} className="w-full rounded-md px-2 py-1 text-left text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">{value.length ? value.join(', ') : 'Empty'}</button>{open && <div role="listbox" aria-label="Task tags" className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"><div className="border-b border-slate-100 p-3 dark:border-slate-800"><input aria-label="Tag name" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); createTag(); } }} placeholder="Search or create a tag" className="w-full bg-transparent text-sm outline-none" /></div><div className="p-2">{draft.trim() && <button type="button" onClick={createTag} className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Create tag {draft.trim()}</button>}{value.map((tag) => <button key={tag} type="button" role="option" aria-selected="true" onClick={() => onChange(value.filter((item) => item !== tag))} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><Tag aria-hidden="true" size={14} className="text-violet-500" />{tag}<X aria-hidden="true" size={13} className="ml-auto text-slate-400" /></button>)}{!draft.trim() && !value.length && <p className="px-2 py-2 text-sm text-slate-500">Create a tag to organize this task.</p>}</div></div>}</div>;
}
function ListToolbar({ statusOptions, selectedStatusKeys, onSelectedStatusKeysChange, hideClosed, assignedToMeOnly, onToggleClosed, onToggleAssigned }: { statusOptions: StatusConfig[]; selectedStatusKeys: string[]; onSelectedStatusKeysChange: (keys: string[]) => void; hideClosed: boolean; assignedToMeOnly: boolean; onToggleClosed: () => void; onToggleAssigned: () => void }) {
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const filterRef = usePickerDismissal(statusFilterOpen, setStatusFilterOpen);
  const toggleStatus = (key: string) => onSelectedStatusKeysChange(selectedStatusKeys.includes(key) ? selectedStatusKeys.filter((item) => item !== key) : [...selectedStatusKeys, key]);
  return <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2 dark:border-slate-800">
    <div ref={filterRef} className="relative">
      <button type="button" aria-label="Status" aria-expanded={statusFilterOpen} onClick={() => setStatusFilterOpen((open) => !open)} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${selectedStatusKeys.length ? 'border-violet-400 bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-200' : 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-300'}`}><Layers3 aria-hidden="true" size={14} />Status{selectedStatusKeys.length ? <span className="rounded-full bg-violet-600 px-1.5 text-[10px] text-white">{selectedStatusKeys.length}</span> : null}<ChevronDown aria-hidden="true" size={13} /></button>
      {statusFilterOpen ? <div role="menu" aria-label="Filter by status" className="absolute left-0 top-9 z-40 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <p className="px-2 pb-2 pt-1 text-xs font-semibold text-slate-500">Filter by status</p>
        <button type="button" role="menuitemcheckbox" aria-checked={!selectedStatusKeys.length} onClick={() => onSelectedStatusKeysChange([])} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><span>All statuses</span>{!selectedStatusKeys.length ? <Check size={15} className="text-indigo-500" /> : null}</button>
        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
        {statusOptions.map((option) => { const key = statusOptionKey(option); const selected = selectedStatusKeys.includes(key); const StatusIcon = option.icon; return <button key={key} type="button" role="menuitemcheckbox" aria-label={`Filter status ${option.label}`} aria-checked={selected} onClick={() => toggleStatus(key)} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><span className="inline-flex items-center gap-2"><StatusIcon size={15} className={option.taskIconClassName} />{option.label}</span>{selected ? <Check size={15} className="text-indigo-500" /> : null}</button>; })}
      </div> : null}
    </div>
    <button type="button" aria-pressed={hideClosed} onClick={onToggleClosed} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${hideClosed ? 'border-indigo-400 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300' : 'border-slate-200 text-slate-500 dark:border-slate-700'}`}><EyeOff aria-hidden="true" size={14} />{hideClosed ? 'Closed hidden' : 'Hide closed'}</button>
    <button type="button" aria-pressed={assignedToMeOnly} onClick={onToggleAssigned} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${assignedToMeOnly ? 'border-indigo-400 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300' : 'border-slate-200 text-slate-500 dark:border-slate-700'}`}><UserRoundCheck aria-hidden="true" size={14} />Assigned to me</button>
  </div>;
}