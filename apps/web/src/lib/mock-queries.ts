import { useQuery } from '@tanstack/react-query';
import { dashboardMetrics, todayTasks } from '@clickflow/contracts';
export function useDashboardData(){return useQuery({queryKey:['dashboard'],queryFn:async()=>({metrics:dashboardMetrics,tasks:todayTasks})});}
