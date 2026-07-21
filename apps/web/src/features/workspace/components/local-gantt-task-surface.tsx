'use client';

import { useMemo, useState } from 'react';
import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import type { LocalListTask, LocalStatusGroup, LocalStatusOverride } from '../model/local-navigation';
import { buildLocalTaskStatusOptions, LocalTaskDetailModal } from './local-list-task-surface';

type LocalGanttTaskSurfaceProps = {
  tasks: LocalListTask[];
  statusGroups: LocalStatusGroup[];
  statusOverrides: LocalStatusOverride[];
  onUpdateTask: (taskId: string, patch: Partial<Omit<LocalListTask, 'id' | 'createdAt'>>) => void;
};

const DAY = 86_400_000;
const toDay = (value: string) => value ? new Date(`${value}T00:00:00`).getTime() : null;
const formatDay = (value: Date) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(value);

export function LocalGanttTaskSurface({ tasks, statusGroups, statusOverrides, onUpdateTask }: LocalGanttTaskSurfaceProps) {
  const today = new Date();
  const [rangeStart, setRangeStart] = useState(() => new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3));
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const statusOptions = buildLocalTaskStatusOptions(statusGroups, statusOverrides);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;
  const days = useMemo(() => Array.from({ length: 14 }, (_, index) => new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate() + index)), [rangeStart]);
  const rangeStartTime = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate()).getTime();
  const move = (amount: number) => setRangeStart((current) => new Date(current.getFullYear(), current.getMonth(), current.getDate() + amount));

  return <section className="p-4">
    <h2 className="sr-only">Task timeline</h2>
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800"><div className="flex items-center gap-2"><CalendarRange size={18} className="text-rose-500" /><h3 className="font-semibold">Timeline</h3></div><div className="flex items-center gap-1"><button type="button" aria-label="Previous timeline range" onClick={() => move(-7)} className="rounded-md p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronLeft size={17} /></button><button type="button" onClick={() => setRangeStart(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3))} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold dark:border-slate-700">Today</button><button type="button" aria-label="Next timeline range" onClick={() => move(7)} className="rounded-md p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronRight size={17} /></button></div></header>
      <div className="min-w-[1060px]"><div className="grid grid-cols-[260px_repeat(14,minmax(56px,1fr))] border-b border-slate-200 text-xs font-medium text-slate-500 dark:border-slate-800"><div className="px-4 py-3">Task</div>{days.map((day) => <div key={day.toISOString()} className="border-l border-slate-100 px-2 py-3 text-center dark:border-slate-900"><span className="block">{formatDay(day)}</span><span className="text-[10px]">{day.toLocaleDateString('en-US', { weekday: 'short' })}</span></div>)}</div>{tasks.map((task) => { const start = toDay(task.startDate) ?? toDay(task.dueDate); const end = toDay(task.dueDate) ?? start; const startIndex = start === null ? -1 : Math.max(0, Math.min(13, Math.floor((start - rangeStartTime) / DAY))); const endIndex = end === null ? -1 : Math.max(startIndex, Math.min(13, Math.floor((end - rangeStartTime) / DAY))); const visible = startIndex >= 0 && endIndex >= 0 && (end ?? 0) >= rangeStartTime && (start ?? 0) <= rangeStartTime + DAY * 14; return <div key={task.id} className="grid grid-cols-[260px_repeat(14,minmax(56px,1fr))] border-b border-slate-100 last:border-b-0 dark:border-slate-900"><button type="button" aria-label={task.title} onClick={() => setSelectedTaskId(task.id)} className="truncate px-4 py-4 text-left text-sm font-medium hover:text-indigo-600">{task.title}</button>{days.map((day, index) => <div key={day.toISOString()} className="relative min-h-14 border-l border-slate-100 dark:border-slate-900">{visible && index === startIndex && <button type="button" aria-label={task.title} onClick={() => setSelectedTaskId(task.id)} style={{ width: `calc(${endIndex - startIndex + 1} * 100%)` }} className="absolute left-1 top-3 z-10 h-7 truncate rounded-md bg-rose-500 px-2 text-left text-xs font-semibold text-white shadow-sm hover:bg-rose-600">{task.title}</button>}</div>)}</div>; })}{tasks.length === 0 && <div className="px-4 py-12 text-sm text-slate-500">No tasks in this scope yet.</div>}</div>
    </div>
    {selectedTask && <LocalTaskDetailModal task={selectedTask} statusOptions={statusOptions} onClose={() => setSelectedTaskId(null)} onUpdate={(patch) => onUpdateTask(selectedTask.id, patch)} />}
  </section>;
}