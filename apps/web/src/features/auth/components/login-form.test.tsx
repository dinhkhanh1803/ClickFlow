import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/features/auth/components/login-form';

describe('LoginForm', () => {
  afterEach(cleanup);
  it('starts the Google mock sign-in action', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: 'Continue with Google' }));

    expect(screen.getByRole('status')).toHaveTextContent('Connecting to Google...');
  });
  it('shows validated mock sign-in fields', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });
});
