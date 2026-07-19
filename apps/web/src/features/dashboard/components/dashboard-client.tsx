'use client';

import { PageState } from '@/components/states/page-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardData } from '@/features/dashboard/data/queries';
import { DashboardWidgets } from '@/features/dashboard/components/dashboard-widgets';
import { MetricCards } from '@/features/dashboard/components/metric-cards';
import { useAuthStore } from '@/features/auth/model/auth-store';
import { dashboardDateLabel, greetingForDate } from './dashboard-presentation';

export function DashboardClient() {
  const { data, isLoading, isError } = useDashboardData();
  const displayName = useAuthStore((state) => state.user?.displayName ?? 'there');
  if (isLoading) return <PageState title="Dashboard" kind="loading" />;
  if (isError || !data) return <PageState title="Dashboard" kind="error" />;

  return <section className="p-6"><div><p className="text-sm text-slate-500">{dashboardDateLabel()}</p><h1 className="mt-1 text-2xl font-bold">{greetingForDate()}, {displayName}</h1></div><MetricCards metrics={data.metrics} /><Card className="mt-6"><CardHeader><CardTitle>My Tasks Today</CardTitle></CardHeader><CardContent>{data.assignedToMe.length ? <div className="divide-y divide-slate-100 dark:divide-slate-800">{data.assignedToMe.map((task) => <div key={task.id} className="flex items-center justify-between gap-4 py-4"><div className="min-w-0"><p className="truncate font-medium">{task.title}</p><p className="mt-1 text-sm text-slate-500">{task.spaceName} · {task.listName}</p></div><span className="shrink-0 text-sm text-slate-500">{task.priority}</span></div>)}</div> : <p className="text-sm text-slate-500">No tasks assigned to you.</p>}</CardContent></Card><DashboardWidgets folderProgress={data.folderProgress} deadlines={data.upcomingDeadlines} /></section>;
}