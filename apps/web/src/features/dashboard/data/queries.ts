import { useQuery } from '@tanstack/react-query';
import { dashboardMetrics, projectHealth, todayTasks, upcomingDeadlines, weeklyHours } from '@clickflow/contracts';
export function useDashboardData(){return useQuery({queryKey:['dashboard'],queryFn:async()=>({metrics:dashboardMetrics,tasks:todayTasks,weeklyHours,deadlines:upcomingDeadlines,projectHealth})});}