import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithQueryClient } from '@/test/render';
import { LoginForm } from './login-form';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));

describe('LoginForm validation', () => {
  it('shows an email error for invalid submit', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<LoginForm />);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
  });
});
