import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

import { useAuthStore } from '../model/auth-store';
import { AuthGate } from './auth-gate';

const replaceLocation = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/lib/navigation/client-navigation', () => ({ replaceLocation }));

afterEach(() => {
  cleanup();
  replaceLocation.mockClear();
  useAuthStore.getState().clearSession();
});

describe('AuthGate', () => {
  it('redirects unauthenticated visitors to login', async () => {
    useAuthStore.getState().clearSession();
    render(<AuthGate><p>Private dashboard</p></AuthGate>);
    await waitFor(() => expect(replaceLocation).toHaveBeenCalledWith('/login'));
    expect(screen.queryByText('Private dashboard')).not.toBeInTheDocument();
  });

  it('renders workspace content for an authenticated session', () => {
    useAuthStore.getState().setSession({
      accessToken: 'access-token', tokenType: 'Bearer', expiresIn: 900, csrfToken: 'csrf-token',
      user: { id: 'user-1', email: 'owner@clickflow.local', displayName: 'Owner', avatarUrl: null, timezone: 'UTC', locale: 'en' }
    });
    render(<AuthGate><p>Private dashboard</p></AuthGate>);
    expect(screen.getByText('Private dashboard')).toBeInTheDocument();
  });
});
