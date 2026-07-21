'use client';

import Link from 'next/link';
import { CheckCircle2, Circle, Clock3, ListChecks } from 'lucide-react';

import { PageState } from '@/components/states/page-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/features/auth/model/auth-store';
import { useWorkspaceNavigationQuery } from '@/features/workspace/data/workspace-queries';
import { collectWorkspaceTasks, compareByDueDate, formatTaskDate, taskHref, taskLocation } from './task-collection';

function isCompleted(status: string) {
  return status.toLowerCase().includes('complete') || status.toLowerCase().includes('done');
}

export function MyTasksClient() {
  const user = useAuthStore((state) => state.user);
  const navigation = useWorkspaceNavigationQuery();

  if (navigation.isLoading) return <PageState title="My Tasks" kind="loading" />;
  if (navigation.isError) return <PageState title="My Tasks" kind="error" />;

  const allTasks = collectWorkspaceTasks(navigation.data);
  const myTasks = allTasks
    .filter(({ task }) => {
      if (!user) return Boolean(task.assigneeId || task.assigneeIds?.length || task.assignee);
      return task.assigneeId === user.id || task.assigneeIds?.includes(user.id) || task.assignees?.some((assignee) => assignee.id === user.id);
    })
    .sort(compareByDueDate);
  const openTasks = myTasks.filter(({ task }) => !isCompleted(task.status));
  const completedTasks = myTasks.length - openTasks.length;

  return <section className="p-6">
    <p className="text-sm text-slate-500">ClickFlow / My Tasks</p>
    <div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold">My Tasks</h1><p className="mt-2 text-sm text-slate-500">All tasks assigned to {user?.displayName ? 'you, ' + user.displayName : 'you'} across every Space.</p></div><div className="grid grid-cols-2 gap-2 text-sm"><span className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800"><strong className="block text-lg text-slate-950 dark:text-white">{openTasks.length}</strong>Open</span><span className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800"><strong className="block text-lg text-slate-950 dark:text-white">{completedTasks}</strong>Done</span></div></div>
    <Card className="mt-6"><CardHeader><CardTitle>Assigned to me</CardTitle></CardHeader><CardContent>{myTasks.length ? <div className="divide-y divide-slate-200 dark:divide-slate-800">{myTasks.map((item) => <Link key={item.task.id} href={taskHref(item)} className="flex items-center gap-3 py-3 text-sm hover:text-indigo-600"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800">{isCompleted(item.task.status) ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} />}</span><span className="min-w-0 flex-1"><span className="block truncate font-medium">{item.task.title}</span><span className="block truncate text-xs text-slate-500"><ListChecks size={12} className="mr-1 inline" />{taskLocation(item)}</span></span><span className="hidden items-center gap-1 text-xs text-slate-500 sm:inline-flex"><Clock3 size={13} />{formatTaskDate(item.task.dueDate)}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{item.task.priority}</span></Link>)}</div> : <p role="status" className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">No tasks are assigned to you yet.</p>}</CardContent></Card>
  </section>;
}
