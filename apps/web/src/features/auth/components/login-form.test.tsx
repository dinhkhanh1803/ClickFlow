import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithQueryClient } from '@/test/render';
import { LoginForm } from './login-form';

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  router.replace.mockReset();
  router.refresh.mockReset();
});

describe('LoginForm', () => {
  it('keeps Google sign-in unavailable until the backend endpoint exists', () => {
    renderWithQueryClient(<LoginForm />);
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeDisabled();
  });

  it('shows validated sign-in fields', () => {
    renderWithQueryClient(<LoginForm />);
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('authenticates through the API and opens the dashboard', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      accessToken: 'access-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      csrfToken: 'csrf-token',
      user: { id: 'user-1', email: 'owner@clickflow.local', displayName: 'Owner', avatarUrl: null, timezone: 'UTC', locale: 'en' }
    }), { status: 200, headers: { 'content-type': 'application/json' } })));
    renderWithQueryClient(<LoginForm />);

    await user.type(screen.getByLabelText('Email address'), 'owner@clickflow.local');
    await user.type(screen.getByLabelText('Password'), 'password-123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeEnabled();
    expect(router.replace).toHaveBeenCalledWith('/dashboard');
  });
});
