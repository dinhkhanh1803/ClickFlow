'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { loadLocalSpaces } from '@/features/workspace/model/local-navigation';
import { deriveLocalDashboard } from '@/features/dashboard/data/local-dashboard';

const dashboardQueryKey = ['dashboard', 'local'] as const;

export function useDashboardData() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const refresh = () => void queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
    window.addEventListener('clickflow:local-spaces-changed', refresh);
    return () => window.removeEventListener('clickflow:local-spaces-changed', refresh);
  }, [queryClient]);

  return useQuery({
    queryKey: dashboardQueryKey,
    queryFn: () => deriveLocalDashboard(loadLocalSpaces()),
  });
}