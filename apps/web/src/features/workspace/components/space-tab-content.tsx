'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Circle, CircleDashed, CircleDot, Flag, Folder, GitBranch, Layers3, Link2, ListChecks, Maximize2, MessageSquare, Minimize2, MoreHorizontal, Paperclip, Plus, Settings2, SlidersHorizontal, Tag, Timer, UserRound, X } from 'lucide-react';
import { useWorkspace } from '../model/workspace-store';
import type { Project, Task, TaskPriority, TaskStatus } from '../model/workspace-types';

export type SpaceView = 'Overview' | 'Board' | 'List' | 'Calendar' | 'Gantt' | 'Table';

type BoardEntry = { project: Project; task: Project['tasks'][number] };

type BoardStatusConfig = {
  status: TaskStatus;
  label: string;
  icon: typeof Circle;
  columnClassName: string;
  badgeClassName: string;
  addClassName: string;
};

const boardStatuses: BoardStatusConfig[] = [
  {
    status: 'Backlog',
    label: 'TO DO',
    icon: CircleDashed,
    columnClassName: 'bg-slate-100 dark:bg-slate-900',
    badgeClassName: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
    addClassName: 'text-slate-500 hover:bg-white/80 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white',
  },
  {
    status: 'In progress',
    label: 'IN PROGRESS',
    icon: CircleDot,
    columnClassName: 'bg-blue-50 dark:bg-blue-950/25',
    badgeClassName: 'bg-blue-500 text-white',
    addClassName: 'text-blue-600 hover:bg-white/80 dark:text-blue-400 dark:hover:bg-blue-950/60',
  },
  {
    status: 'Done',
    label: 'COMPLETE',
    icon: CheckCircle2,
    columnClassName: 'bg-emerald-50 dark:bg-emerald-950/25',
    badgeClassName: 'bg-emerald-600 text-white',
    addClassName: 'text-emerald-600 hover:bg-white/80 dark:text-emerald-400 dark:hover:bg-emerald-950/60',
  },
];

function TaskMetadata({ entry }: { entry: BoardEntry }) {
  const { project, task } = entry;
  const priorityClassName = task.priority === 'High' ? 'text-rose-500' : task.priority === 'Low' ? 'text-slate-400' : 'text-amber-500';
  const itemClassName = 'grid h-7 w-7 place-items-center rounded-md border border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400';

  return <span className="mt-3 flex items-center gap-1.5" aria-label="Task details">
    <span className={itemClassName} title={`Assignee: ${task.assignee}`}><UserRound aria-hidden="true" size={14} /></span>
    <span className={itemClassName} title={task.dueDate ? `Due: ${task.dueDate}` : 'No due date'}><CalendarDays aria-hidden="true" size={14} /></span>
    <span className={`${itemClassName} ${priorityClassName}`} title={`Priority: ${task.priority}`}><Flag aria-hidden="true" size={14} /></span>
    <span className={itemClassName} title={`Project: ${project.name}`}><Tag aria-hidden="true" size={14} /></span>
  </span>;
}

function SpaceList({ projects, onOpenTask }: { projects: Project[]; onOpenTask: (projectId: string, taskId: string) => void }) {
  if (!projects.length) return <section className="pb-8"><h2 className="sr-only">Space List</h2><div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2 dark:border-slate-800"><button type="button" className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-300"><Layers3 aria-hidden="true" size={14} />Status</button><button type="button" aria-label="List grouping options" className="rounded-md p-1.5 text-slate-500"><GitBranch aria-hidden="true" size={14} /></button></div><section className="px-5 pt-5"><header className="flex items-center gap-2"><ChevronDown aria-hidden="true" size={15} className="text-slate-500" /><span className="inline-flex items-center gap-1 rounded-md bg-slate-200 px-1.5 py-0.5 text-[11px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-100"><CircleDashed aria-hidden="true" size={13} />TO DO</span><span className="text-xs text-slate-500">0</span></header><div className="mt-3 grid grid-cols-[minmax(260px,1fr)_9rem_10rem_8rem_8rem_2rem] items-center gap-3 border-b border-slate-100 px-5 py-2 text-xs font-medium text-slate-500 dark:border-slate-900"><span>Name</span><span>Assignee</span><span>Due date</span><span>Priority</span><span>Comments</span><button type="button" aria-label="Add field to TO DO" className="justify-self-end rounded p-1"><Plus size={15} /></button></div><button type="button" className="flex w-full items-center gap-3 border-b border-slate-100 px-5 py-3 text-left text-sm text-slate-500 hover:text-indigo-600 dark:border-slate-900"><CircleDashed size={16} className="text-slate-400" />Add Task</button><button type="button" className="mt-5 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600"><Plus size={16} />New status</button></section></section>;
  return <section className="pb-8">
    <h2 className="sr-only">Space List</h2>
    <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2 dark:border-slate-800">
      <button type="button" className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-300">
        <Layers3 aria-hidden="true" size={14} />Status
      </button>
      <button type="button" aria-label="List grouping options" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-900 dark:hover:text-white">
        <GitBranch aria-hidden="true" size={14} />
      </button>
    </div>
    <div className="space-y-5 px-4 pt-4">
      {projects.filter((project) => !project.archived).map((project) => <section key={project.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-900">
          <ChevronDown aria-hidden="true" size={16} className="text-slate-500" />
          <Folder aria-hidden="true" size={16} className="text-slate-500" />
          <div>
            <p className="text-xs text-slate-500">ClickFlow Product / Projects</p>
            <h3 className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{project.name}</h3>
          </div>
          <button type="button" aria-label={'More options for ' + project.name} className="ml-1 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-white"><MoreHorizontal size={16} /></button>
        </header>
        {boardStatuses.map(({ status, label, icon: StatusIcon, badgeClassName }) => {
          const tasks = project.tasks.filter((task) => task.status === status);
          if (!tasks.length) return null;
          const statusIconClassName = status === 'Done' ? 'text-emerald-500' : status === 'In progress' ? 'text-blue-500' : 'text-slate-400';

          return <section key={status} className="border-b border-slate-100 last:border-b-0 dark:border-slate-900">
            <header className="flex items-center gap-2 px-4 pt-4 pb-2">
              <ChevronDown aria-hidden="true" size={15} className="text-slate-500" />
              <span className={'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold ' + badgeClassName}>
                <StatusIcon aria-hidden="true" size={13} />{label}
              </span>
              <span className="text-xs text-slate-500">{tasks.length}</span>
            </header>
            <div className="grid grid-cols-[minmax(260px,1fr)_9rem_10rem_8rem_2rem] items-center gap-3 border-b border-slate-100 px-5 py-2 text-xs font-medium text-slate-500 dark:border-slate-900">
              <span>Name</span><span>Assignee</span><span>Due date</span><span>Priority</span><button type="button" aria-label={'Add field to ' + label} className="justify-self-end rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-900"><Plus size={15} /></button>
            </div>
            {tasks.map((task) => <button type="button" aria-label={task.title} onClick={() => onOpenTask(project.id, task.id)} key={task.id} className="grid w-full grid-cols-[minmax(260px,1fr)_9rem_10rem_8rem_2rem] items-center gap-3 border-b border-slate-100 px-5 py-2.5 text-left text-sm transition hover:bg-slate-50 dark:border-slate-900 dark:hover:bg-slate-900/50">
              <div className="flex min-w-0 items-center gap-3"><StatusIcon aria-hidden="true" size={16} className={statusIconClassName} /><span className="truncate font-medium text-slate-900 dark:text-slate-100">{task.title}</span></div>
              <span className="inline-flex items-center gap-1.5 text-slate-500"><UserRound aria-hidden="true" size={15} />{task.assignee}</span>
              <span className="inline-flex items-center gap-1.5 text-slate-500"><CalendarDays aria-hidden="true" size={15} />{task.dueDate || 'No date'}</span>
              <span className="inline-flex items-center gap-1.5 text-slate-500"><Flag aria-hidden="true" size={15} className={task.priority === 'High' ? 'text-rose-500' : task.priority === 'Low' ? 'text-slate-400' : 'text-amber-500'} />{task.priority}</span>
              <span />
            </button>)}
            <button type="button" className="flex items-center gap-2 px-5 py-3 text-sm text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"><Plus aria-hidden="true" size={16} />Add task</button>
          </section>;
        })}
      </section>)}
    </div>
  </section>;
}

export function SpaceTaskModal({ project, task, onClose }: { project: Project; task: Task; onClose: () => void }) {
  const { updateTask, addComment } = useWorkspace();
  const [fullscreen, setFullscreen] = useState(false);
  const [comment, setComment] = useState('');
  const updateField = (patch: Partial<Pick<Task, 'title' | 'status' | 'priority' | 'assignee' | 'dueDate' | 'description'>>) => updateTask(project.id, task.id, patch);
  const postComment = () => { if (!comment.trim()) return; addComment(project.id, task.id, comment.trim()); setComment(''); };

  return <div className="fixed inset-y-0 left-0 right-0 z-[90] md:left-[76px]" role="presentation">
    <button aria-label="Close task detail" className="absolute inset-0 h-full w-full cursor-default bg-slate-950/35 backdrop-blur-[1px]" onClick={onClose} />
    <section role="dialog" aria-modal="true" aria-labelledby="space-task-detail-title" className={'absolute grid overflow-hidden border border-slate-200 bg-white shadow-2xl shadow-slate-950/30 dark:border-slate-700 dark:bg-slate-950 ' + (fullscreen ? 'inset-0 rounded-none' : 'inset-y-[2.5vh] left-[1.25vw] right-[1.25vw] rounded-2xl')}>
      <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="min-h-0 overflow-y-auto px-7 py-6 sm:px-10 sm:py-8">
          <header className="flex items-center justify-between gap-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5"><Folder size={14} />{project.name}</span>
            <div className="flex items-center gap-1">
              <button type="button" aria-label={fullscreen ? 'Exit full screen' : 'Enter full screen'} aria-pressed={fullscreen} onClick={() => setFullscreen((value) => !value)} className="rounded-md p-2 hover:bg-slate-100 dark:hover:bg-slate-800">{fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button>
              <button type="button" aria-label="Close task detail" onClick={onClose} className="rounded-md p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={17} /></button>
            </div>
          </header>
          <div className="mt-6 inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><Circle size={11} className={task.status === 'Done' ? 'fill-emerald-500 text-emerald-500' : task.status === 'In progress' ? 'fill-blue-500 text-blue-500' : 'text-slate-400'} />Task<ChevronDown size={13} /></div>
          <input id="space-task-detail-title" aria-label="Task title" value={task.title} onChange={(event) => updateField({ title: event.target.value })} className="mt-3 w-full rounded-lg border border-transparent bg-transparent px-1 py-1 text-3xl font-bold leading-tight text-slate-900 outline-none focus:border-slate-200 focus:bg-white dark:text-white dark:focus:border-slate-700 dark:focus:bg-slate-900" />
          <div className="mt-6 grid gap-x-14 gap-y-4 border-b border-slate-200 pb-7 text-sm sm:grid-cols-2 dark:border-slate-800">
            <div className="grid grid-cols-[9.5rem_1fr] items-center gap-3"><span className="inline-flex items-center gap-2 text-slate-500"><CircleDot size={16} />Status</span><select aria-label="Status" value={task.status} onChange={(event) => updateField({ status: event.target.value as TaskStatus })} className={'w-fit rounded-md border-0 px-2 py-1.5 text-xs font-bold outline-none ' + (task.status === 'Done' ? 'bg-emerald-500 text-white' : task.status === 'In progress' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200')}>{boardStatuses.map(({ status, label }) => <option key={status} value={status}>{label}</option>)}</select></div>
            <div className="grid grid-cols-[9.5rem_1fr] items-center gap-3"><span className="inline-flex items-center gap-2 text-slate-500"><UserRound size={16} />Assignees</span><input aria-label="Assignee" value={task.assignee} onChange={(event) => updateField({ assignee: event.target.value })} className="min-w-0 border-b border-transparent bg-transparent px-1 py-1 text-slate-800 outline-none hover:border-slate-200 focus:border-indigo-500 dark:text-slate-200 dark:hover:border-slate-700" /></div>
            <div className="grid grid-cols-[9.5rem_1fr] items-center gap-3"><span className="inline-flex items-center gap-2 text-slate-500"><CalendarDays size={16} />Dates</span><label className="inline-flex items-center gap-1 text-slate-500"><span>Start</span><span className="text-slate-400">→</span><input aria-label="Due date" type="date" value={task.dueDate} onChange={(event) => updateField({ dueDate: event.target.value })} className="min-w-0 border-0 bg-transparent p-0 text-slate-700 outline-none dark:text-slate-300" /></label></div>
            <div className="grid grid-cols-[9.5rem_1fr] items-center gap-3"><span className="inline-flex items-center gap-2 text-slate-500"><Flag size={16} />Priority</span><select aria-label="Priority" value={task.priority} onChange={(event) => updateField({ priority: event.target.value as TaskPriority })} className="w-fit border-0 bg-transparent p-0 text-slate-700 outline-none dark:text-slate-300">{['Low', 'Normal', 'High'].map((priority) => <option key={priority}>{priority}</option>)}</select></div>
            <div className="grid grid-cols-[9.5rem_1fr] items-center gap-3"><span className="inline-flex items-center gap-2 text-slate-500"><Timer size={16} />Time estimate</span><button type="button" className="text-left text-slate-400 hover:text-indigo-500">Empty</button></div>
            <div className="grid grid-cols-[9.5rem_1fr] items-center gap-3"><span className="inline-flex items-center gap-2 text-slate-500"><Timer size={16} />Track time</span><button type="button" className="inline-flex w-fit items-center gap-1 text-slate-400 hover:text-indigo-500"><CircleDot size={16} />Start</button></div>
            <div className="grid grid-cols-[9.5rem_1fr] items-center gap-3"><span className="inline-flex items-center gap-2 text-slate-500"><Tag size={16} />Tags</span><button type="button" className="text-left text-slate-400 hover:text-indigo-500">Empty</button></div>
          </div>
          <label className="mt-5 block"><span className="text-sm text-slate-500">Description</span><textarea aria-label="Description" value={task.description} onChange={(event) => updateField({ description: event.target.value })} placeholder="Add more details for this task..." className="mt-2 min-h-24 w-full resize-y rounded-lg border border-transparent bg-transparent px-2 py-2 text-sm text-slate-700 outline-none hover:border-slate-200 focus:border-indigo-400 focus:bg-slate-50 dark:text-slate-200 dark:hover:border-slate-800 dark:focus:bg-slate-900" /></label>
          <div className="mt-8 space-y-4 border-t border-slate-200 pt-6 dark:border-slate-800"><button type="button" className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"><Settings2 size={16} />Add fields</button><button type="button" className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"><GitBranch size={16} />Add subtask</button><button type="button" className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"><Link2 size={16} />Relate items or add dependencies</button><section><button type="button" className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"><ListChecks size={16} />Create checklist</button>{task.checklist.length ? <ul className="mt-3 space-y-2 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">{task.checklist.map((item) => <li key={item.id}>{item.label}</li>)}</ul> : null}</section><button type="button" className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"><Paperclip size={16} />Attach file</button></div>
        </main>        <aside className="flex min-h-0 flex-col border-t border-slate-200 bg-slate-50/90 p-5 lg:border-l lg:border-t-0 dark:border-slate-800 dark:bg-slate-900/50">
          <h3 className="font-semibold">Activity</h3>
          <div className="mt-4 flex-1 space-y-3 overflow-y-auto text-sm">{[...task.activity].reverse().map((event) => <div key={event.id} className="rounded-lg bg-white p-3 shadow-sm dark:bg-slate-950"><p>{event.message}</p><span className="mt-1 block text-xs text-slate-400">{event.createdAt}</span></div>)}{task.comments.map((item) => <div key={item.id} className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 dark:border-indigo-950 dark:bg-indigo-950/30"><p className="font-semibold">{item.author}</p><p className="mt-1">{item.body}</p></div>)}</div>
          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800"><textarea aria-label="Comment" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Write a comment..." className="min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950" /><button type="button" onClick={postComment} className="mt-2 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"><MessageSquare size={15} />Post comment</button></div>
        </aside>
      </div>
    </section>
  </div>;
}

function SpaceTable({ entries, onOpenTask }: { entries: BoardEntry[]; onOpenTask: (projectId: string, taskId: string) => void }) {
  return <section>
    <h2 className="sr-only">Space Table</h2>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-2 dark:border-slate-800">
      <button type="button" className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-300"><Layers3 size={14} />Shown</button>
      <div className="flex items-center gap-1"><button type="button" aria-label="Filter table" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"><SlidersHorizontal size={16} /></button><button type="button" aria-label="Table settings" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"><Settings2 size={16} /></button><button type="button" className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"><Plus size={16} />Task</button></div>
    </div>
    <div className="overflow-x-auto"><div className="min-w-[980px]"><div className="grid grid-cols-[2.5rem_2.5rem_minmax(260px,1fr)_10rem_12rem_12rem_10rem_2.5rem] border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900"><span className="grid place-items-center border-r border-slate-200 py-3 dark:border-slate-800"><input aria-label="Select all tasks" type="checkbox" /></span><span className="border-r border-slate-200 py-3 text-center dark:border-slate-800"></span><span className="border-r border-slate-200 px-3 py-3 dark:border-slate-800">Name</span><span className="border-r border-slate-200 px-3 py-3 dark:border-slate-800">Assignee</span><span className="border-r border-slate-200 px-3 py-3 dark:border-slate-800">Status</span><span className="border-r border-slate-200 px-3 py-3 dark:border-slate-800">Due date</span><span className="border-r border-slate-200 px-3 py-3 dark:border-slate-800">Priority</span><button type="button" aria-label="Add table field" className="grid place-items-center hover:bg-slate-100 dark:hover:bg-slate-800"><Plus size={16} /></button></div>{entries.map(({ project, task }, index) => { const statusConfig = boardStatuses.find((item) => item.status === task.status); const StatusIcon = statusConfig?.icon ?? Circle; return <div key={task.id} role="button" tabIndex={0} onClick={() => onOpenTask(project.id, task.id)} className="grid cursor-pointer grid-cols-[2.5rem_2.5rem_minmax(260px,1fr)_10rem_12rem_12rem_10rem_2.5rem] border-b border-slate-100 text-sm transition hover:bg-slate-50 dark:border-slate-900 dark:hover:bg-slate-900/50"><span className="grid place-items-center border-r border-slate-100 dark:border-slate-900"><input aria-label={'Select ' + task.title} type="checkbox" /></span><span className="border-r border-slate-100 py-3 text-center text-xs text-slate-400 dark:border-slate-900">{index + 1}</span><span className="flex items-center gap-2 border-r border-slate-100 px-3 py-3 font-medium text-slate-900 dark:border-slate-900 dark:text-slate-100"><StatusIcon size={16} className={task.status === 'Done' ? 'text-emerald-500' : task.status === 'In progress' ? 'text-blue-500' : 'text-slate-400'} />{task.title}<span className="ml-auto text-xs font-normal text-slate-400">{project.name}</span></span><span className="flex items-center gap-1.5 border-r border-slate-100 px-3 py-3 text-slate-500 dark:border-slate-900"><UserRound size={15} />{task.assignee}</span><span className="border-r border-slate-100 px-3 py-3 dark:border-slate-900"><span className={'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold ' + statusConfig?.badgeClassName}><StatusIcon size={13} />{statusConfig?.label}</span></span><span className="flex items-center gap-1.5 border-r border-slate-100 px-3 py-3 text-slate-500 dark:border-slate-900"><CalendarDays size={15} />{task.dueDate || 'No date'}</span><span className="flex items-center gap-1.5 border-r border-slate-100 px-3 py-3 text-slate-500 dark:border-slate-900"><Flag size={15} className={task.priority === 'High' ? 'text-rose-500' : task.priority === 'Low' ? 'text-slate-400' : 'text-amber-500'} />{task.priority}</span><span /></div>; })}<button type="button" className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"><Plus size={16} />Add task</button></div></div>
  </section>;
}

const julyCalendarDates = [
  { day: 28, current: false }, { day: 29, current: false }, { day: 30, current: false },
  ...Array.from({ length: 31 }, (_, index) => ({ day: index + 1, current: true })),
  { day: 1, current: false },
];

function SpaceCalendar({ entries, onOpenTask }: { entries: BoardEntry[]; onOpenTask: (projectId: string, taskId: string) => void }) {
  return <section>
    <h2 className="sr-only">Space Calendar</h2>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-2 dark:border-slate-800">
      <div className="flex items-center gap-2 text-sm"><button type="button" className="rounded-md px-2 py-1.5 font-medium hover:bg-slate-100 dark:hover:bg-slate-900">Today</button><button type="button" className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900">Month<ChevronDown size={14} /></button><span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-800" /><button type="button" aria-label="Previous month" className="rounded p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900"><ChevronLeft size={17} /></button><button type="button" aria-label="Next month" className="rounded p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900"><ChevronRight size={17} /></button><span className="ml-1 font-semibold">July 2026</span></div>
      <div className="flex items-center gap-1"><button type="button" aria-label="Filter calendar" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"><SlidersHorizontal size={16} /></button><button type="button" aria-label="Calendar settings" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"><Settings2 size={16} /></button><button type="button" className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"><Plus size={16} />Task</button></div>
    </div>
    <div className="p-4"><div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"><div className="grid grid-cols-7 border-b border-slate-200 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300">{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => <span key={day} className="px-3 py-3">{day}</span>)}</div><div className="grid grid-cols-7">{julyCalendarDates.map(({ day, current }, index) => { const dueTasks = current ? entries.filter(({ task }) => task.dueDate === `2026-07-${String(day).padStart(2, '0')}`) : []; return <div className={'group min-h-32 border-b border-r border-slate-100 p-2 last:border-r-0 dark:border-slate-900 ' + (current ? '' : 'bg-slate-50/70 dark:bg-slate-900/30')} key={`${current ? 'july' : index}-${day}`}><span className={'float-right text-xs ' + (current ? 'text-slate-500' : 'text-slate-400')}>{day}</span><div className="clear-both space-y-1 pt-5">{dueTasks.map(({ project, task }) => <button type="button" key={task.id} onClick={() => onOpenTask(project.id, task.id)} className={'block w-full truncate rounded px-2 py-1 text-left text-xs font-medium ' + (task.status === 'Done' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200' : task.status === 'In progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-200' : 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-200')}>{task.title}</button>)}</div></div>; })}</div></div></div>
  </section>;
}

const ganttDays = [
  { day: 'Sa 11', weekend: true }, { day: 'Su 12', weekend: true }, { day: 'Mo 13' }, { day: 'Tu 14' }, { day: 'We 15' }, { day: 'Th 16', today: true }, { day: 'Fr 17' },
  { day: 'Sa 18', weekend: true }, { day: 'Su 19', weekend: true }, { day: 'Mo 20' }, { day: 'Tu 21' }, { day: 'We 22' }, { day: 'Th 23' },
];

function SpaceGantt({ projects, onOpenTask }: { projects: Project[]; onOpenTask: (projectId: string, taskId: string) => void }) {
  const schedule = [[3, 4], [5, 4], [7, 4], [9, 4]];
  let sidebarTaskIndex = 0;
  let timelineTaskIndex = 0;

  return <section>
    <h2 className="sr-only">Space Gantt</h2>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-2 dark:border-slate-800">
      <div className="flex items-center gap-1 text-sm"><button type="button" className="rounded-md px-2 py-1.5 font-medium hover:bg-slate-100 dark:hover:bg-slate-900">Today</button><button type="button" className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900">Week<ChevronDown size={14} /></button><button type="button" className="rounded-md px-2 py-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900">Auto fit</button><button type="button" className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"><CalendarDays size={14} />Export</button></div>
      <div className="flex items-center gap-1"><button type="button" className="hidden rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 sm:inline-flex dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">Save view<ChevronDown size={13} /></button><button type="button" aria-label="Gantt dependencies" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"><GitBranch size={16} /></button><button type="button" aria-label="Gantt filters" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"><SlidersHorizontal size={16} /></button><button type="button" aria-label="Gantt settings" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"><Settings2 size={16} /></button><button type="button" className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"><Plus size={16} />Task</button></div>
    </div>
    <div className="overflow-x-auto"><div className="min-w-[1280px] border-b border-slate-200 dark:border-slate-800"><div className="grid grid-cols-[340px_minmax(0,1fr)]"><div className="border-r border-b border-slate-200 px-5 py-3 text-xs font-medium text-slate-500 dark:border-slate-800">Name</div><div className="grid grid-cols-[repeat(13,minmax(68px,1fr))] border-b border-slate-200 text-center text-xs font-medium text-slate-500 dark:border-slate-800"><span className="col-span-7 border-r border-slate-200 py-3 dark:border-slate-800">W28 <span className="ml-2 text-slate-400">Jul 12 - 18</span></span><span className="col-span-6 py-3">W29 <span className="ml-2 text-slate-400">Jul 19 - 25</span></span></div></div><div className="grid grid-cols-[340px_minmax(0,1fr)]"><div className="border-r border-slate-200 dark:border-slate-800"><div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3 text-sm font-semibold dark:border-slate-900"><ChevronDown size={15} className="text-slate-500" /><Folder size={16} className="text-slate-500" />Projects</div>{projects.filter((project) => !project.archived).map((project) => <div key={project.id}><div className="flex items-center gap-2 border-b border-slate-100 px-7 py-3 text-sm font-medium dark:border-slate-900"><ChevronDown size={14} className="text-slate-500" /><Layers3 size={15} className="text-slate-500" />{project.name}</div>{project.tasks.map((task) => { const config = boardStatuses.find((item) => item.status === task.status); const StatusIcon = config?.icon ?? Circle; return <button type="button" onClick={() => onOpenTask(project.id, task.id)} key={task.id} className="flex h-14 w-full items-center gap-2 border-b border-slate-100 px-10 text-left text-sm hover:bg-slate-50 dark:border-slate-900 dark:hover:bg-slate-900/50"><StatusIcon size={15} className={task.status === 'Done' ? 'text-emerald-500' : task.status === 'In progress' ? 'text-blue-500' : 'text-slate-400'} /><span className="truncate">{task.title}</span></button>; })}</div>)}</div><div><div className="grid grid-cols-[repeat(13,minmax(68px,1fr))] border-b border-slate-200 dark:border-slate-800">{ganttDays.map(({ day, weekend, today }) => <div key={day} className={'relative h-10 border-r border-slate-100 pt-3 text-center text-xs dark:border-slate-900 ' + (weekend ? 'bg-slate-50/80 text-slate-400 dark:bg-slate-900/45' : 'text-slate-500')}>{today ? <><span className="inline-grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-[10px] font-bold text-white">16</span><span className="absolute left-1/2 top-9 bottom-[-1000px] z-10 w-px -translate-x-1/2 bg-rose-500" /></> : day}</div>)}</div>{projects.filter((project) => !project.archived).map((project) => <div key={project.id}><div className="grid h-[45px] grid-cols-[repeat(13,minmax(68px,1fr))] border-b border-slate-100 dark:border-slate-900">{ganttDays.map(({ day, weekend }) => <span key={day} className={'border-r border-slate-100 dark:border-slate-900 ' + (weekend ? 'bg-slate-50/80 dark:bg-slate-900/45' : '')} />)}</div>{project.tasks.map((task) => { const [start, span] = schedule[timelineTaskIndex % schedule.length]; timelineTaskIndex += 1; const barClassName = task.status === 'Done' ? 'bg-emerald-500' : task.status === 'In progress' ? 'bg-blue-500' : 'bg-violet-500'; return <div key={task.id} className="relative grid h-14 grid-cols-[repeat(13,minmax(68px,1fr))] border-b border-slate-100 dark:border-slate-900">{ganttDays.map(({ day, weekend }) => <span key={day} className={'border-r border-slate-100 dark:border-slate-900 ' + (weekend ? 'bg-slate-50/80 dark:bg-slate-900/45' : '')} />)}<button type="button" onClick={() => onOpenTask(project.id, task.id)} style={{ gridColumn: `${start} / span ${span}` }} className={'z-20 mx-2 my-3 rounded-full px-3 py-2 text-left text-xs font-medium text-white shadow-sm ' + barClassName}>{task.title}</button></div>; })}</div>)}</div></div></div></div>
  </section>;
}
function SpaceBoard({ entries, projects, onOpenProject, onOpenTask }: { entries: BoardEntry[]; projects: Project[]; onOpenProject: (id: string) => void; onOpenTask: (projectId: string, taskId: string) => void }) {
  const fallbackProjectId = projects[0]?.id;

  return <section>
    <h2 className="sr-only">Space Board</h2>
    <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2 dark:border-slate-800">
      <button type="button" className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-300">
        <Layers3 aria-hidden="true" size={14} />Status
      </button>
      <button type="button" aria-label="Board grouping options" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-900 dark:hover:text-white">
        <GitBranch aria-hidden="true" size={14} />
      </button>
    </div>
    <div className="flex min-h-[520px] items-start gap-2 overflow-x-auto p-4">
      {boardStatuses.map(({ status, label, icon: StatusIcon, columnClassName, badgeClassName, addClassName }) => {
        const statusEntries = entries.filter((entry) => entry.task.status === status);
        const targetProjectId = statusEntries[0]?.project.id ?? fallbackProjectId;
        const openTargetProject = () => { if (targetProjectId) onOpenProject(targetProjectId); };

        return <article key={status} aria-label={`${label} column`} className={`group w-60 shrink-0 2xl:w-64 self-start rounded-xl p-2 ${columnClassName}`}>
          <header className="flex min-h-8 items-center justify-between gap-2 px-1">
            <div className="flex min-w-0 items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${badgeClassName}`}>
                <StatusIcon aria-hidden="true" size={13} />{label}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{statusEntries.length}</span>
            </div>
            <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <button type="button" aria-label={`${label} options`} className="rounded p-1 text-slate-400 hover:bg-white/80 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"><MoreHorizontal size={15} /></button>
              <button type="button" aria-label={`Add task to ${label}`} onClick={openTargetProject} disabled={!targetProjectId} className="rounded p-1 text-slate-400 hover:bg-white/80 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-800 dark:hover:text-white"><Plus size={15} /></button>
            </div>
          </header>
          <div className="mt-2 space-y-2">
            {statusEntries.map((entry) => <button type="button" key={entry.task.id} onClick={() => onOpenTask(entry.project.id, entry.task.id)} className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-px hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/90 dark:hover:border-indigo-700">
              <span className="block text-sm font-semibold leading-5 text-slate-900 dark:text-slate-100">{entry.task.title}</span>
              <TaskMetadata entry={entry} />
            </button>)}
          </div>
          <button type="button" aria-label={`Add task in ${label}`} onClick={openTargetProject} disabled={!targetProjectId} className={`mt-2 flex w-full items-center gap-1 rounded-lg px-2 py-2 text-left text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 ${addClassName}`}>
            <Plus aria-hidden="true" size={16} />Add task
          </button>
        </article>;
      })}
      <button type="button" aria-label="Add group" className="mt-1 inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-3 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-900 dark:hover:text-white">
        <Plus aria-hidden="true" size={16} />Add group
      </button>
    </div>
  </section>;
}

export function SpaceTabContent({ view, projects, onOpenProject }: { view: Exclude<SpaceView, 'Overview'>; projects: Project[]; onOpenProject: (id: string) => void }) {
  const entries = projects.flatMap((project) => project.tasks.map((task) => ({ project, task })));
  const [selectedTask, setSelectedTask] = useState<{ projectId: string; taskId: string } | null>(null);
  const selectedProject = selectedTask ? projects.find((project) => project.id === selectedTask.projectId) : undefined;
  const selectedTaskValue = selectedProject && selectedTask ? selectedProject.tasks.find((task) => task.id === selectedTask.taskId) : undefined;
  const openTask = (projectId: string, taskId: string) => {
    setSelectedTask({ projectId, taskId });
    const url = new URL(window.location.href);
    url.searchParams.set('project', projectId);
    url.searchParams.set('task', taskId);
    url.searchParams.set('view', view);
    window.history.pushState(null, '', url);
  };
  const closeTask = () => {
    setSelectedTask(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('project');
    url.searchParams.delete('task');
    url.searchParams.delete('view');
    window.history.replaceState(null, '', url);
  };
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const taskId = params.get('task');
    const projectId = params.get('project');
    const project = projects.find((item) => item.id === projectId) ?? projects.find((item) => item.tasks.some((task) => task.id === taskId));
    if (project && taskId && project.tasks.some((task) => task.id === taskId)) setSelectedTask({ projectId: project.id, taskId });
  }, [projects]);
  const taskDialog = selectedProject && selectedTaskValue ? <SpaceTaskModal project={selectedProject} task={selectedTaskValue} onClose={closeTask} /> : null;
  if (view === 'Board') return <><SpaceBoard entries={entries} projects={projects} onOpenProject={onOpenProject} onOpenTask={openTask} />{taskDialog}</>;
  if (view === 'List') return <><SpaceList projects={projects} onOpenTask={openTask} />{taskDialog}</>;
  if (view === 'Table') return <><SpaceTable entries={entries} onOpenTask={openTask} />{taskDialog}</>;
  if (view === 'Calendar') return <><SpaceCalendar entries={entries} onOpenTask={openTask} />{taskDialog}</>;
  return <><SpaceGantt projects={projects} onOpenTask={openTask} />{taskDialog}</>;
}