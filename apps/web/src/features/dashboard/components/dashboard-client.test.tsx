import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { useAuthStore } from '@/features/auth/model/auth-store';
import { DashboardClient } from './dashboard-client';

vi.mock('@/features/dashboard/data/queries', () => ({
  useDashboardData: () => ({
    data: { metrics: [], assignedToMe: [], folderProgress: [], upcomingDeadlines: [] },
    isLoading: false,
    isError: false
  })
}));

afterEach(() => {
  cleanup();
  useAuthStore.getState().clearSession();
});

describe('DashboardClient', () => {
  it('greets the authenticated user instead of a mock identity', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 19, 8));
    useAuthStore.getState().setSession({
      accessToken: 'access-token', tokenType: 'Bearer', expiresIn: 900, csrfToken: 'csrf-token',
      user: { id: 'user-1', email: 'demo@clickflow.local', displayName: 'ClickFlow Demo', avatarUrl: null, timezone: 'UTC', locale: 'en' }
    });

    render(<DashboardClient />);

    expect(screen.getByRole('heading', { name: 'Good morning, ClickFlow Demo' })).toBeInTheDocument();
    expect(screen.queryByText('Good morning, Khanh')).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
