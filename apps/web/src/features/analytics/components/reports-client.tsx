'use client';

import { useQuery } from '@tanstack/react-query';

import { PageState } from '@/components/states/page-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { analyticsApi } from '@/features/analytics/data/analytics-api';
import { useAuthStore } from '@/features/auth/model/auth-store';
import { useWorkspaceNavigationQuery } from '@/features/workspace/data/workspace-queries';

const range = () => {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 30);
  return { from: from.toISOString(), to: to.toISOString() };
};

export function ReportsClient() {
  const token = useAuthStore((state) => state.accessToken);
  const navigation = useWorkspaceNavigationQuery();
  const workspace = navigation.data?.[0];
  const dates = range();
  const time = useQuery({
    queryKey: ['time-report', workspace?.id, dates.from.slice(0, 10)],
    queryFn: () => analyticsApi.timeReport(token!, workspace!.id, dates.from, dates.to),
    enabled: Boolean(token && workspace),
  });
  const progress = useQuery({
    queryKey: ['progress-report', workspace?.id, dates.from.slice(0, 10)],
    queryFn: () => analyticsApi.progressReport(token!, workspace!.id, dates.from, dates.to),
    enabled: Boolean(token && workspace),
  });

  if (navigation.isLoading || time.isLoading || progress.isLoading) return <PageState title="Reports" kind="loading" />;
  if (!workspace || navigation.isError || time.isError || progress.isError || !time.data || !progress.data) return <PageState title="Reports" kind="error" />;

  return <section className="space-y-6 p-6"><div><h1 className="text-2xl font-bold">Reports</h1><p className="text-sm text-slate-500">Last 30 days ? {workspace.name}</p></div><div className="grid gap-4 md:grid-cols-3"><Card><CardHeader><CardTitle>Tracked time</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{time.data.totalHours.toFixed(1)}h</CardContent></Card><Card><CardHeader><CardTitle>Completed tasks</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{progress.data.completedTasks}</CardContent></Card><Card><CardHeader><CardTitle>Completion rate</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{progress.data.completionPercent}%</CardContent></Card></div><Card><CardHeader><CardTitle>Progress by project</CardTitle></CardHeader><CardContent className="space-y-4">{progress.data.byProject.map((project) => { const percent = project.totalTasks ? Math.round(project.completedTasks / project.totalTasks * 100) : 0; return <div key={project.projectId}><div className="flex justify-between text-sm"><span>{project.projectName}</span><span>{project.completedTasks}/{project.totalTasks}</span></div><div className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-emerald-500" style={{ width: percent + '%' }} /></div></div>; })}</CardContent></Card><Card><CardHeader><CardTitle>Time by project</CardTitle></CardHeader><CardContent className="divide-y divide-slate-100 dark:divide-slate-800">{time.data.byProject.map((project) => <div key={project.projectId} className="flex justify-between py-3 text-sm"><span>{project.projectName}</span><span className="font-semibold">{(project.seconds / 3600).toFixed(1)}h</span></div>)}</CardContent></Card></section>;
}
