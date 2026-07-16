import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/features/auth/components/login-form';

describe('LoginForm validation', () => {
  it('shows an email error for invalid submit', async () => {
    const user=userEvent.setup(); render(<LoginForm />); await user.click(screen.getByRole('button',{name:'Sign in'})); expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
  });
});
