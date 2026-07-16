import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoginForm } from '@/features/auth/components/login-form';

describe('LoginForm', () => {
  it('shows validated mock sign-in fields', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });
});
