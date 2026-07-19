'use client';

import { useMemo, useState } from 'react';
import { Clock3, PlayCircle } from 'lucide-react';

import { PageState } from '@/components/states/page-state';
import { useWorkspaceNavigationQuery } from '@/features/workspace/data/workspace-queries';

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
};

export function TimeTrackingClient() {
  const navigation = useWorkspaceNavigationQuery();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const workspaces = navigation.data ?? [];
  const workspaceId = selectedWorkspaceId || workspaces[0]?.id || '';
  const entries = navigation.timeEntries.filter((entry) => entry.workspaceId === workspaceId && entry.archivedAt === null);
  const tasks = useMemo(() => new Map(workspaces.flatMap((space) => space.items.flatMap((item) => item.tasks ?? [])).map((task) => [task.id, task])), [workspaces]);
  const totalSeconds = entries.reduce((total, entry) => total + (entry.durationSeconds ?? 0), 0);
  const running = entries.find((entry) => entry.endedAt === null);

  if (navigation.isLoading) return <PageState title="Loading time entries" kind="loading" />;
  if (navigation.isError) return <PageState title="Unable to load time tracking" kind="error" />;
  if (!workspaces.length) return <PageState title="No Workspace yet" kind="empty" />;

  return <div className="space-y-6 p-6">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-medium text-indigo-600">Productivity</p><h1 className="text-3xl font-bold">Time Tracking</h1><p className="mt-1 text-sm text-slate-500">API-backed timers and time entries for your Workspace.</p></div>
      <label className="text-sm font-medium">Workspace<select aria-label="Time tracking Workspace" value={workspaceId} onChange={(event) => setSelectedWorkspaceId(event.target.value)} className="ml-3 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">{workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}</select></label>
    </header>
    <section className="grid gap-4 md:grid-cols-2">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"><Clock3 className="text-indigo-500" /><p className="mt-4 text-sm text-slate-500">Total logged</p><p className="text-3xl font-bold">{formatDuration(totalSeconds)}</p></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"><PlayCircle className={running ? 'text-emerald-500' : 'text-slate-400'} /><p className="mt-4 text-sm text-slate-500">Current timer</p><p className="text-lg font-semibold">{running ? tasks.get(running.taskId)?.title ?? 'Running task' : 'No timer running'}</p></article>
    </section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"><div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800"><h2 className="font-semibold">Recent entries</h2></div>{entries.length ? <div className="divide-y divide-slate-100 dark:divide-slate-900">{entries.map((entry) => <article key={entry.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="font-medium">{tasks.get(entry.taskId)?.title ?? 'Task'}</p><p className="text-xs text-slate-500">{entry.note || 'No note'}</p></div><time className="text-sm text-slate-500">{new Date(entry.startedAt).toLocaleString()}</time><span className="font-semibold">{entry.endedAt ? formatDuration(entry.durationSeconds ?? 0) : 'Running'}</span></article>)}</div> : <p className="px-5 py-12 text-center text-sm text-slate-500">No time entries in this Workspace.</p>}</section>
  </div>;
}
