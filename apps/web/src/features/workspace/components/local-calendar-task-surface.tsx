'use client';

import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import type { LocalListTask, LocalStatusGroup, LocalStatusOverride } from '../model/local-navigation';
import { buildLocalTaskStatusOptions, LocalTaskDetailModal } from './local-list-task-surface';

type LocalCalendarTaskSurfaceProps = {
  tasks: LocalListTask[];
  statusGroups: LocalStatusGroup[];
  statusOverrides: LocalStatusOverride[];
  onUpdateTask: (taskId: string, patch: Partial<Omit<LocalListTask, 'id' | 'createdAt'>>) => void;
};

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function LocalCalendarTaskSurface({ tasks, statusGroups, statusOverrides, onUpdateTask }: LocalCalendarTaskSurfaceProps) {
  const now = new Date();
  const [cursor, setCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const statusOptions = buildLocalTaskStatusOptions(statusGroups, statusOverrides);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const startOffset = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay();
  const taskByDueDate = tasks.reduce<Record<string, LocalListTask[]>>((result, task) => {
    if (task.dueDate) (result[task.dueDate] ??= []).push(task);
    return result;
  }, {});
  const unscheduledTasks = tasks.filter((task) => !task.dueDate);
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(cursor);
  const goToToday = () => setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
  const moveMonth = (amount: number) => setCursor((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));

  return <section className="p-4">
    <h2 className="sr-only">Task calendar</h2>
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2"><CalendarDays className="text-orange-500" size={18} /><h3 className="text-base font-semibold" aria-live="polite">{monthLabel}</h3></div>
        <div className="flex items-center gap-1"><button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"><ChevronLeft size={17} /></button><button type="button" onClick={goToToday} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700">Today</button><button type="button" aria-label="Next month" onClick={() => moveMonth(1)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"><ChevronRight size={17} /></button></div>
      </header>
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">{weekdays.map((weekday) => <div key={weekday} className="border-r border-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 last:border-r-0 dark:border-slate-900">{weekday}</div>)}</div>
      <div className="grid grid-cols-7">{Array.from({ length: 42 }, (_, index) => {
        const day = index - startOffset + 1;
        const inMonth = day > 0 && day <= daysInMonth;
        const key = inMonth ? dateKey(cursor.getFullYear(), cursor.getMonth(), day) : '';
        const dueTasks = inMonth ? taskByDueDate[key] ?? [] : [];
        const isToday = key === dateKey(now.getFullYear(), now.getMonth(), now.getDate());
        return <div key={index} className={`min-h-32 border-b border-r border-slate-100 p-2 last:border-r-0 dark:border-slate-900 ${inMonth ? '' : 'bg-slate-50/60 dark:bg-slate-900/20'}`}><span className={`grid h-6 w-6 place-items-center rounded-full text-xs ${isToday ? 'bg-indigo-600 font-semibold text-white' : 'text-slate-500'}`}>{inMonth ? day : ''}</span><div className="mt-1 space-y-1">{dueTasks.map((task) => { const status = statusOptions.find((option) => option.groupId ? task.statusGroupId === option.groupId : !task.statusGroupId && task.status === option.status); return <button key={task.id} type="button" aria-label={task.title} onClick={() => setSelectedTaskId(task.id)} className="block w-full truncate rounded-md border border-transparent bg-indigo-50 px-2 py-1 text-left text-xs font-medium text-indigo-950 transition hover:border-indigo-300 hover:bg-indigo-100 dark:bg-indigo-950/45 dark:text-indigo-100 dark:hover:bg-indigo-900/60"><span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${status?.taskIconClassName ?? 'bg-slate-400'}`} />{task.title}</button>; })}</div></div>;
      })}</div>
    </div>
    {unscheduledTasks.length > 0 && <section className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-900/20"><h3 className="text-sm font-semibold">No due date</h3><div className="mt-3 flex flex-wrap gap-2">{unscheduledTasks.map((task) => <button key={task.id} type="button" aria-label={task.title} onClick={() => setSelectedTaskId(task.id)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950">{task.title}</button>)}</div></section>}
    {selectedTask && <LocalTaskDetailModal task={selectedTask} statusOptions={statusOptions} onClose={() => setSelectedTaskId(null)} onUpdate={(patch) => onUpdateTask(selectedTask.id, patch)} />}
  </section>;
}
