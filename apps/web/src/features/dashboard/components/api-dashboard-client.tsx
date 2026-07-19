'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, CalendarClock, CheckCircle2, FolderKanban, ListTodo } from 'lucide-react';

import { PageState } from '@/components/states/page-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { analyticsApi } from '@/features/analytics/data/analytics-api';
import { useAuthStore } from '@/features/auth/model/auth-store';
import { MetricCards } from '@/features/dashboard/components/metric-cards';
import { useWorkspaceNavigationQuery } from '@/features/workspace/data/workspace-queries';
import { dashboardDateLabel, greetingForDate } from './dashboard-presentation';

const healthStyle = {
  ON_TRACK: { label: 'On track', badge: 'bg-sky-500/10 text-sky-400', bar: 'bg-sky-500' },
  AT_RISK: { label: 'At risk', badge: 'bg-amber-500/10 text-amber-400', bar: 'bg-amber-500' },
  OVERDUE: { label: 'Overdue', badge: 'bg-rose-500/10 text-rose-400', bar: 'bg-rose-500' },
  COMPLETED: { label: 'Completed', badge: 'bg-emerald-500/10 text-emerald-400', bar: 'bg-emerald-500' },
} as const;

const formatEvent = (value: string) => value.toLowerCase().replaceAll('_', ' ').replace(/^./, (character) => character.toUpperCase());
const formatRelativeTime = (value: string) => {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, 'second');
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour');
  return formatter.format(Math.round(hours / 24), 'day');
};

export function ApiDashboardClient() {
  const navigation = useWorkspaceNavigationQuery();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const workspace = navigation.data?.[0];
  const dashboard = useQuery({
    queryKey: ['analytics-dashboard', workspace?.id],
    queryFn: () => analyticsApi.dashboard(accessToken as string, workspace!.id),
    enabled: Boolean(accessToken && workspace)
  });

  if (navigation.isLoading || dashboard.isLoading) return <PageState title="Overview" kind="loading" />;
  if (navigation.isError || dashboard.isError || !workspace || !dashboard.data) return <PageState title="Overview" kind="error" />;

  const data = dashboard.data;
  const metrics = [
    { label: 'Active projects', value: String(data.metrics.activeProjects) },
    { label: 'Due today', value: String(data.metrics.dueToday) },
    { label: 'Overdue tasks', value: String(data.metrics.overdueTasks) },
    { label: 'Weekly hours', value: String(data.metrics.weeklyHours) }
  ];
  const assignedTasks = workspace.items
    .filter((item) => item.kind === 'list')
    .flatMap((list) => (list.tasks ?? []).filter((task) => task.assigneeId === user?.id).map((task) => ({ task, list })))
    .sort((left, right) => (left.task.dueDate || '9999').localeCompare(right.task.dueDate || '9999'));
  const totalTasks = data.projectHealth.reduce((total, project) => total + project.totalTasks, 0);
  const completedTasks = data.projectHealth.reduce((total, project) => total + project.completedTasks, 0);
  const overallProgress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const attentionProjects = data.projectHealth.filter((project) => project.health === 'AT_RISK' || project.health === 'OVERDUE').length;
  const recentActivity = [...navigation.activities].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 5);

  return <section className="mx-auto w-full max-w-[1600px] p-5 md:p-7">
    <header className="relative overflow-hidden rounded-3xl border border-indigo-400/15 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 px-6 py-7 md:px-8">
      <div className="relative">
        <p className="text-sm text-slate-400">{dashboardDateLabel()}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">{greetingForDate()}, {user?.displayName ?? 'there'}</h1>
        <p className="mt-2 text-sm text-slate-400">Overview of <span className="font-medium text-slate-300">{workspace.name}</span> / Updated {new Date(data.generatedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </header>

    <MetricCards metrics={metrics} />

    <div className="mt-6 grid gap-6 xl:grid-cols-12">
      <Card className="xl:col-span-8">
        <CardHeader className="flex-row items-center justify-between">
          <div><CardTitle>My priorities</CardTitle><p className="mt-2 text-sm text-slate-500">Tasks assigned to you, ordered by due date</p></div>
          <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">{assignedTasks.length} tasks</span>
        </CardHeader>
        <CardContent>{assignedTasks.length ? <div className="divide-y divide-slate-200/60 dark:divide-slate-800">
          {assignedTasks.slice(0, 6).map(({ task, list }) => <div key={task.id} className="flex items-center gap-4 py-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-indigo-400"><ListTodo className="size-4" /></span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{task.title}</p><p className="mt-1 truncate text-xs text-slate-500">{list.name} / {task.status}</p></div>
            <div className="text-right"><p className="text-xs font-medium text-slate-400">{task.priority}</p><p className="mt-1 text-xs text-slate-500">{task.dueDate ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${task.dueDate}T00:00:00`)) : 'No due date'}</p></div>
          </div>)}
        </div> : <EmptyState icon={CheckCircle2} title="You're all caught up" detail="No tasks are currently assigned to you." />}</CardContent>
      </Card>

      <Card className="xl:col-span-4">
        <CardHeader><CardTitle>Workspace pulse</CardTitle><p className="mt-2 text-sm text-slate-500">Overall completion across active projects</p></CardHeader>
        <CardContent>
          <div className="flex items-end justify-between"><div><span className="text-4xl font-bold">{overallProgress}%</span><p className="mt-1 text-sm text-slate-500">{completedTasks} of {totalTasks} tasks completed</p></div><FolderKanban className="size-8 text-indigo-400" /></div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${overallProgress}%` }} /></div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-500/5 p-3"><p className="text-2xl font-semibold">{data.projectHealth.length}</p><p className="text-xs text-slate-500">Projects tracked</p></div>
            <div className="rounded-xl bg-slate-500/5 p-3"><p className={attentionProjects ? 'text-2xl font-semibold text-amber-400' : 'text-2xl font-semibold'}>{attentionProjects}</p><p className="text-xs text-slate-500">Need attention</p></div>
          </div>
        </CardContent>
      </Card>

      <Card className="xl:col-span-7">
        <CardHeader><CardTitle>Project health</CardTitle><p className="mt-2 text-sm text-slate-500">Progress and delivery risk by project</p></CardHeader>
        <CardContent>{data.projectHealth.length ? <div className="space-y-5">{data.projectHealth.map((project) => {
          const style = healthStyle[project.health];
          return <div key={project.id}>
            <div className="flex items-center justify-between gap-3 text-sm"><div className="min-w-0"><p className="truncate font-medium">{project.name}</p><p className="mt-1 text-xs text-slate-500">{project.completedTasks}/{project.totalTasks} tasks / {project.overdueTasks} overdue</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${style.badge}`}>{style.label}</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className={`h-full rounded-full ${style.bar}`} style={{ width: `${project.progressPercent}%` }} /></div>
          </div>;
        })}</div> : <EmptyState icon={FolderKanban} title="No project data yet" detail="Project progress will appear after tasks are created." />}</CardContent>
      </Card>

      <Card className="xl:col-span-5">
        <CardHeader><CardTitle>Recent activity</CardTitle><p className="mt-2 text-sm text-slate-500">Latest updates from your workspace</p></CardHeader>
        <CardContent>{recentActivity.length ? <div className="space-y-5">{recentActivity.map((item) => <div key={item.id} className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-sky-500/10 text-sky-400"><Activity className="size-4" /></span><div className="min-w-0"><p className="text-sm"><span className="font-medium">{item.actor?.displayName ?? 'System'}</span> <span className="text-slate-400">{formatEvent(item.eventType).toLowerCase()}</span></p><p className="mt-1 text-xs text-slate-500">{formatRelativeTime(item.createdAt)}</p></div></div>)}</div> : <EmptyState icon={Activity} title="No recent activity" detail="Task updates and comments will show up here." />}</CardContent>
      </Card>
    </div>
  </section>;
}

function EmptyState({ icon: Icon, title, detail }: { icon: typeof CalendarClock; title: string; detail: string }) {
  return <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-slate-300/60 px-5 text-center dark:border-slate-700"><div><span className="mx-auto grid size-11 place-items-center rounded-2xl bg-slate-500/10 text-slate-400"><Icon className="size-5" /></span><p className="mt-3 text-sm font-medium">{title}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div></div>;
}
