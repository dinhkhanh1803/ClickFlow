import type { LocalListTask } from '@/features/workspace/model/local-navigation';

type TaskAssignmentChartProps = { tasks: LocalListTask[] };

export function TaskAssignmentChart({ tasks }: TaskAssignmentChartProps) {
  const entries = [
    { label: 'Assigned', count: tasks.filter((task) => Boolean(task.assignee.trim())).length, color: '#6366f1' },
    { label: 'Unassigned', count: tasks.filter((task) => !task.assignee.trim()).length, color: '#94a3b8' },
  ];
  const total = tasks.length;
  let cursor = 0;
  const segments = entries.filter((entry) => entry.count > 0).map((entry) => {
    const start = (cursor / total) * 360;
    cursor += entry.count;
    return `${entry.color} ${start}deg ${(cursor / total) * 360}deg`;
  });
  const chartBackground = total ? `conic-gradient(${segments.join(', ')})` : 'radial-gradient(circle, #e2e8f0 0 58%, #cbd5e1 59% 100%)';

  return <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div><h2 className="text-sm font-semibold">Task assignment</h2><p className="mt-1 text-xs text-slate-500">{total} {total === 1 ? 'task' : 'tasks'} in this scope</p></div><div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:justify-center"><div role="img" aria-label="Task assignment chart" className="relative h-44 w-44 shrink-0 rounded-full" style={{ background: chartBackground }}><div className="absolute inset-[22%] grid place-items-center rounded-full bg-white text-center dark:bg-slate-950"><span className="text-2xl font-bold">{total}</span><span className="text-[11px] text-slate-500">tasks</span></div></div><ul className="grid w-full max-w-sm gap-2">{entries.map((entry) => <li key={entry.label} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800"><span className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} /><span className="truncate font-medium">{entry.label}</span></span><span className="text-slate-500">{entry.count} {entry.count === 1 ? 'task' : 'tasks'}</span></li>)}</ul></div></section>;
}