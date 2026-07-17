import type { LocalDashboardMetric } from '@/features/dashboard/data/local-dashboard';
import { Card, CardContent } from '@/components/ui/card';

export function MetricCards({ metrics }: { metrics: LocalDashboardMetric[] }) {
  return <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <Card key={metric.label}><CardContent className="p-5"><p className="text-xs text-slate-500">{metric.label}</p><p className="mt-2 text-3xl font-bold text-indigo-500">{metric.value}</p></CardContent></Card>)}</div>;
}