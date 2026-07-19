import type { LocalListTask, LocalStatusColor, LocalStatusGroup, LocalStatusOverride } from '@/features/workspace/model/local-navigation';

type StatusEntry = { key: string; status: string; count: number; color: string };

type TaskStatusChartProps = {
  tasks: LocalListTask[];
  statusGroups?: LocalStatusGroup[];
  statusOverrides?: LocalStatusOverride[];
};

const statusColors: Record<LocalStatusColor, string> = {
  slate: '#64748b',
  blue: '#3b82f6',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  teal: '#14b8a6',
  emerald: '#10b981',
  amber: '#f59e0b',
  orange: '#f97316',
  rose: '#f43f5e',
  pink: '#ec4899',
};

const defaultStatuses: Array<{ status: string; label: string; color: LocalStatusColor }> = [
  { status: 'Backlog', label: 'TO DO', color: 'slate' },
  { status: 'In progress', label: 'IN PROGRESS', color: 'blue' },
  { status: 'Done', label: 'COMPLETE', color: 'emerald' },
];

export function TaskStatusChart({ tasks, statusGroups = [], statusOverrides = [] }: TaskStatusChartProps) {
  const includeLocalDefaults = !statusGroups.some((group) => group.source === 'api') && !tasks.some((task) => task.statusGroupId);
  const configuredEntries: StatusEntry[] = [
    ...(includeLocalDefaults ? defaultStatuses : []).map((item) => {
      const override = statusOverrides.find((candidate) => candidate.status === item.status);
      return {
        key: `default:${item.status}`,
        status: (override?.name ?? item.label).toUpperCase(),
        count: tasks.filter((task) => !task.statusGroupId && (task.status === item.status || task.status.toUpperCase() === item.label)).length,
        color: statusColors[override?.color ?? item.color],
      };
    }),
    ...statusGroups.map((group) => ({
      key: `group:${group.id}`,
      status: group.name.toUpperCase(),
      count: tasks.filter((task) => task.statusGroupId === group.id).length,
      color: statusColors[group.color ?? 'indigo'],
    })),
  ];
  const configuredTaskIds = new Set(
    tasks.filter((task) => task.statusGroupId
      ? statusGroups.some((group) => group.id === task.statusGroupId)
      : defaultStatuses.some((item) => task.status === item.status || task.status.toUpperCase() === item.label)).map((task) => task.id),
  );
  const unconfiguredEntries = Array.from(tasks.filter((task) => !configuredTaskIds.has(task.id)).reduce((groups, task) => groups.set(task.status, (groups.get(task.status) ?? 0) + 1), new Map<string, number>()).entries()).map(([status, count]) => ({ key: `unconfigured:${status}`, status: status.toUpperCase(), count, color: statusColors.slate }));
  const entries = [...configuredEntries, ...unconfiguredEntries];
  const total = tasks.length;
  let cursor = 0;
  const segments = entries.filter((entry) => entry.count > 0).map((entry) => {
    const start = (cursor / total) * 360;
    cursor += entry.count;
    return `${entry.color} ${start}deg ${(cursor / total) * 360}deg`;
  });
  const chartBackground = total ? `conic-gradient(${segments.join(', ')})` : 'radial-gradient(circle, #e2e8f0 0 58%, #cbd5e1 59% 100%)';

  return <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-sm font-semibold">Task status</h2><p className="mt-1 text-xs text-slate-500">{total} {total === 1 ? 'task' : 'tasks'} in this scope</p></div></div><div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:justify-center"><div role="img" aria-label="Task status chart" className="relative h-44 w-44 shrink-0 rounded-full" style={{ background: chartBackground }}><div className="absolute inset-[22%] grid place-items-center rounded-full bg-white text-center dark:bg-slate-950"><span className="text-2xl font-bold">{total}</span><span className="text-[11px] text-slate-500">tasks</span></div></div><ul className="grid w-full max-w-sm gap-2">{entries.map((entry) => <li key={entry.key} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800"><span className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} /><span className="truncate font-medium">{entry.status}</span></span><span className="text-slate-500">{entry.count} {entry.count === 1 ? 'task' : 'tasks'}</span></li>)}</ul></div></section>;
}