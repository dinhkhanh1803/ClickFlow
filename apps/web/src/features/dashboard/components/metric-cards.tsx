import { CalendarClock, Clock3, FolderKanban, TriangleAlert } from 'lucide-react';
import type { LocalDashboardMetric } from '@/features/dashboard/data/local-dashboard';
import { Card, CardContent } from '@/components/ui/card';

const metricPresentation = [
  { icon: FolderKanban, tone: 'bg-indigo-500/10 text-indigo-400' },
  { icon: CalendarClock, tone: 'bg-sky-500/10 text-sky-400' },
  { icon: TriangleAlert, tone: 'bg-rose-500/10 text-rose-400' },
  { icon: Clock3, tone: 'bg-emerald-500/10 text-emerald-400' },
] as const;

export function MetricCards({ metrics }: { metrics: LocalDashboardMetric[] }) {
  return <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric, index) => {
    const presentation = metricPresentation[index % metricPresentation.length];
    const Icon = presentation.icon;
    return <Card key={metric.label} className="group overflow-hidden"><CardContent className="flex items-center justify-between p-5">
      <div><p className="text-sm text-slate-500">{metric.label}</p><p className="mt-2 text-3xl font-bold tracking-tight">{metric.value}</p></div>
      <span className={`grid size-11 place-items-center rounded-2xl transition-transform group-hover:scale-105 ${presentation.tone}`}><Icon className="size-5" /></span>
    </CardContent></Card>;
  })}</div>;
}
