import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

import { useAuthStore } from '../model/auth-store';
import { AuthProvider } from './auth-provider';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.cookie = 'clickflow_csrf=; Max-Age=0; Path=/';
  useAuthStore.getState().clearSession();
});

describe('AuthProvider', () => {
  it('restores a session with the readable CSRF cookie', async () => {
    document.cookie = 'clickflow_csrf=csrf-cookie; Path=/';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      accessToken: 'renewed-access-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      csrfToken: 'rotated-csrf-token',
      user: { id: 'user-1', email: 'owner@clickflow.local', displayName: 'Owner', avatarUrl: null, timezone: 'UTC', locale: 'en' }
    }), { status: 200, headers: { 'content-type': 'application/json' } })));

    render(<AuthProvider><p>Application</p></AuthProvider>);
    expect(screen.getByText('Application')).toBeInTheDocument();
    await waitFor(() => expect(useAuthStore.getState().status).toBe('authenticated'));
    expect(useAuthStore.getState().accessToken).toBe('renewed-access-token');
  });

  it('marks the session unauthenticated when no CSRF cookie exists', async () => {
    useAuthStore.getState().setLoading();
    render(<AuthProvider><p>Application</p></AuthProvider>);
    await waitFor(() => expect(useAuthStore.getState().status).toBe('unauthenticated'));
  });
});
