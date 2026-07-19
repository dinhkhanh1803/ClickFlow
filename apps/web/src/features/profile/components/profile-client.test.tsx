import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { ProfileClient } from './profile-client';
import { useAuthStore } from '@/features/auth/model/auth-store';

afterEach(() => { cleanup(); useAuthStore.setState({ user: null, accessToken: null, status: 'unauthenticated' }); });

describe('ProfileClient', () => {
  it('previews and saves a validated avatar image', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({ status: 'authenticated', accessToken: null, user: { id: 'user-1', email: 'khanh@clickflow.local', displayName: 'Khanh Tran', avatarUrl: null, timezone: 'UTC', locale: 'en' } });
    render(<ProfileClient />);

    await user.upload(screen.getByLabelText('Choose avatar image'), new File(['avatar'], 'avatar.png', { type: 'image/png' }));
    expect(await screen.findByAltText('Profile avatar')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save profile' }));

    await waitFor(() => expect(useAuthStore.getState().user?.avatarUrl).toMatch(/^data:image\/png;base64,/));
  });

  it('rejects files larger than one megabyte', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({ status: 'authenticated', accessToken: null, user: { id: 'user-1', email: 'khanh@clickflow.local', displayName: 'Khanh Tran', avatarUrl: null, timezone: 'UTC', locale: 'en' } });
    render(<ProfileClient />);
    await user.upload(screen.getByLabelText('Choose avatar image'), new File([new Uint8Array(1_000_001)], 'large.png', { type: 'image/png' }));
    expect(screen.getByRole('alert')).toHaveTextContent('up to 1 MB');
  });
});
