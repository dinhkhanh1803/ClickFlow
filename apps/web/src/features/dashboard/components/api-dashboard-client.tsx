'use client';

import { useQuery } from '@tanstack/react-query';

import { PageState } from '@/components/states/page-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { analyticsApi } from '@/features/analytics/data/analytics-api';
import { useAuthStore } from '@/features/auth/model/auth-store';
import { MetricCards } from '@/features/dashboard/components/metric-cards';
import { useWorkspaceNavigationQuery } from '@/features/workspace/data/workspace-queries';

const todayLabel = () => new Intl.DateTimeFormat(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

export function ApiDashboardClient() {
  const navigation = useWorkspaceNavigationQuery();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const workspace = navigation.data?.[0];
  const dashboard = useQuery({
    queryKey: ['analytics-dashboard', workspace?.id],
    queryFn: () => analyticsApi.dashboard(accessToken!, workspace!.id),
    enabled: Boolean(accessToken && workspace?.id)
  });

  if (navigation.isLoading || dashboard.isLoading) return <PageState title="Dashboard" kind="loading" />;
  if (navigation.isError || dashboard.isError || !workspace || !dashboard.data) return <PageState title="Dashboard" kind="error" />;

  const data = dashboard.data;
  const metrics = [
    { label: 'Active projects', value: String(data.metrics.activeProjects) },
    { label: 'Due today', value: String(data.metrics.dueToday) },
    { label: 'Overdue tasks', value: String(data.metrics.overdueTasks) },
    { label: 'Weekly hours', value: String(data.metrics.weeklyHours) }
  ];
  const assignedTasks = workspace.items.filter((item) => item.kind === 'list').flatMap((list) => (list.tasks ?? []).filter((task) => task.assigneeId === user?.id).map((task) => ({ task, list })));

  return <section className="p-6"><div><p className="text-sm text-slate-500">{todayLabel()}</p><h1 className="mt-1 text-2xl font-bold">Good morning, {user?.displayName ?? 'there'}</h1><p className="mt-1 text-sm text-slate-500">{workspace.name} ? generated {new Date(data.generatedAt).toLocaleTimeString()}</p></div><MetricCards metrics={metrics} /><div className="mt-6 grid gap-6 xl:grid-cols-2"><Card><CardHeader><CardTitle>My Tasks</CardTitle></CardHeader><CardContent>{assignedTasks.length ? <div className="divide-y divide-slate-100 dark:divide-slate-800">{assignedTasks.map(({ task, list }) => <div key={task.id} className="flex items-center justify-between gap-4 py-3"><div><p className="font-medium">{task.title}</p><p className="text-xs text-slate-500">{list.name}</p></div><span className="text-sm text-slate-500">{task.priority}</span></div>)}</div> : <p className="text-sm text-slate-500">No tasks assigned to you.</p>}</CardContent></Card><Card><CardHeader><CardTitle>Project health</CardTitle></CardHeader><CardContent className="space-y-4">{data.projectHealth.map((project) => <div key={project.id}><div className="flex justify-between text-sm"><span className="font-medium">{project.name}</span><span className="text-slate-500">{project.progressPercent}% ? {project.health.replaceAll('_', ' ')}</span></div><div className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${project.progressPercent}%` }} /></div></div>)}</CardContent></Card></div></section>;
}
