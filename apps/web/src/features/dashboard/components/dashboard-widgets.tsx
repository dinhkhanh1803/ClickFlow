import type { LocalDashboardFolderProgress, LocalDashboardTask } from '@/features/dashboard/data/local-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`));

export function DashboardWidgets({ folderProgress, deadlines }: { folderProgress: LocalDashboardFolderProgress[]; deadlines: LocalDashboardTask[] }) {
  if (!folderProgress.length && !deadlines.length) return null;

  return <div className="mt-6 grid gap-6 xl:grid-cols-2">{folderProgress.length ? <Card><CardHeader><CardTitle>Folder progress</CardTitle></CardHeader><CardContent className="space-y-5">{folderProgress.map((folder) => <div key={folder.id}><div className="flex items-center justify-between gap-3 text-sm"><span className="font-medium">{folder.name}</span><span className="text-slate-500">{folder.completed}/{folder.total} tasks</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full bg-indigo-500" style={{ width: `${folder.progress}%` }} /></div><p className="mt-1 text-right text-xs text-slate-500">{folder.progress}% complete</p></div>)}</CardContent></Card> : null}{deadlines.length ? <Card><CardHeader><CardTitle>Upcoming deadlines</CardTitle></CardHeader><CardContent className="space-y-4">{deadlines.map((task) => <div key={task.id} className="border-l-2 border-indigo-400 pl-3"><p className="text-sm font-medium">{task.title}</p><p className="mt-1 text-sm text-slate-500">{formatDate(task.dueDate)} · {task.listName}</p></div>)}</CardContent></Card> : null}</div>;
}