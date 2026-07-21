import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithQueryClient } from '@/test/render';
import { PasswordRecoveryForm } from './password-recovery-form';

describe('PasswordRecoveryForm', () => {
  it('validates a recovery email before submission', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<PasswordRecoveryForm mode="forgot" />);
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
  });

  it('validates reset password confirmation', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<PasswordRecoveryForm mode="reset" token={'t'.repeat(40)} />);
    await user.type(screen.getByLabelText('New password'), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password456');
    await user.click(screen.getByRole('button', { name: 'Update password' }));
    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
  });
});
