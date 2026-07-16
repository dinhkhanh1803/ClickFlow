import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppHeader } from '@/components/app-shell';

describe('AppHeader', () => {
  it('opens the avatar menu', async () => {
    const user = userEvent.setup();
    render(<AppHeader />);
    await user.click(screen.getByRole('button', { name: 'Open account menu' }));
    expect(screen.getByRole('menu')).toHaveTextContent('Profile');
  });
});