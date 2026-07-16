'use client';
import { useDashboardData } from '@/features/dashboard/data/queries';
import { PageState } from '@/components/states/page-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { useUiStore } from '@/stores/ui-store';
import { notifyTaskCreation, notifyToastPreview } from '@/lib/feedback/toast-feedback';
import { DashboardWidgets } from '@/features/dashboard/components/dashboard-widgets';
import { MetricCards } from '@/features/dashboard/components/metric-cards';

export function DashboardClient(){
  const { data, isLoading, isError } = useDashboardData();
  const { isCreateTaskOpen, openCreateTask, closeCreateTask } = useUiStore();
  if(isLoading)return <PageState title="Dashboard" kind="loading"/>;
  if(isError||!data)return <PageState title="Dashboard" kind="error"/>;
  return <section className="p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-sm text-slate-500">Thursday, October 26, 2023</p><h1 className="mt-1 text-2xl font-bold">Good morning, Khanh</h1></div><div className="flex gap-2"><Button variant="outline" onClick={notifyToastPreview}>Test toast</Button><Button onClick={openCreateTask}>New Task</Button></div></div><MetricCards metrics={data.metrics} /><Card className="mt-6"><CardHeader><CardTitle>My Tasks Today</CardTitle></CardHeader><CardContent>{data.tasks.length===0?<p className="text-slate-500">No tasks today.</p>:data.tasks.map(task=><div key={task.id} className="flex justify-between border-t border-slate-100 py-4 dark:border-slate-800"><span>{task.title}</span><span className="text-sm text-slate-500">{task.priority}</span></div>)}</CardContent></Card><DashboardWidgets weeklyHours={data.weeklyHours} deadlines={data.deadlines} projectHealth={data.projectHealth} /><Dialog open={isCreateTaskOpen} onOpenChange={open => open ? openCreateTask() : closeCreateTask()}><DialogTitle>Create task</DialogTitle><p className="mt-2 text-sm text-slate-500">Mock task creation is ready for the Phase 2 API workflow.</p><Button className="mt-5" onClick={() => { notifyTaskCreation(); closeCreateTask(); }}>Done</Button></Dialog></section>;
}