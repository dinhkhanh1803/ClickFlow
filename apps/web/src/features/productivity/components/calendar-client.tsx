'use client';

import Link from 'next/link';
import { CalendarDays } from 'lucide-react';

import { PageState } from '@/components/states/page-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkspaceNavigationQuery } from '@/features/workspace/data/workspace-queries';
import { collectWorkspaceTasks, compareByDueDate, formatTaskDate, taskHref, taskLocation } from './task-collection';

function isSameMonth(date: string, today: Date) {
  if (!date) return false;
  const value = new Date(date + 'T00:00:00');
  return value.getFullYear() === today.getFullYear() && value.getMonth() === today.getMonth();
}

export function CalendarClient() {
  const navigation = useWorkspaceNavigationQuery();
  if (navigation.isLoading) return <PageState title="Calendar" kind="loading" />;
  if (navigation.isError) return <PageState title="Calendar" kind="error" />;

  const today = new Date();
  const tasks = collectWorkspaceTasks(navigation.data).filter(({ task }) => Boolean(task.dueDate)).sort(compareByDueDate);
  const thisMonth = tasks.filter(({ task }) => isSameMonth(task.dueDate, today));
  const grouped = thisMonth.reduce<Record<string, typeof thisMonth>>((result, item) => {
    const key = item.task.dueDate;
    result[key] = [...(result[key] ?? []), item];
    return result;
  }, {});
  const days = Object.keys(grouped).sort();

  return <section className="p-6"><p className="text-sm text-slate-500">ClickFlow / Calendar</p><h1 className="mt-2 text-3xl font-bold">Calendar</h1><p className="mt-2 text-sm text-slate-500">Upcoming work with due dates in the current month.</p><div className="mt-6 grid gap-4 xl:grid-cols-[1fr_20rem]"><Card><CardHeader><CardTitle>This month</CardTitle></CardHeader><CardContent>{days.length ? <div className="space-y-4">{days.map((day) => <article key={day} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"><h2 className="flex items-center gap-2 text-sm font-semibold"><CalendarDays size={16} className="text-indigo-500" />{formatTaskDate(day)}</h2><div className="mt-3 space-y-2">{grouped[day].map((item) => <Link key={item.task.id} href={taskHref(item)} className="block rounded-lg bg-slate-50 px-3 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 dark:bg-slate-900/70 dark:hover:bg-indigo-950/40"><span className="block font-medium">{item.task.title}</span><span className="text-xs text-slate-500">{taskLocation(item)}</span></Link>)}</div></article>)}</div> : <p role="status" className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">No due tasks in this month.</p>}</CardContent></Card><Card><CardHeader><CardTitle>Planning summary</CardTitle></CardHeader><CardContent><dl className="space-y-3 text-sm"><div className="flex justify-between"><dt>Total scheduled</dt><dd className="font-semibold">{tasks.length}</dd></div><div className="flex justify-between"><dt>This month</dt><dd className="font-semibold">{thisMonth.length}</dd></div><div className="flex justify-between"><dt>Without due date</dt><dd className="font-semibold">{collectWorkspaceTasks(navigation.data).filter(({ task }) => !task.dueDate).length}</dd></div></dl></CardContent></Card></div></section>;
}
