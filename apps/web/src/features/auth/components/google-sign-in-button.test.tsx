import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GoogleSignInButton } from './google-sign-in-button';

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'google');
});

describe('GoogleSignInButton', () => {
  it('stays unavailable without a public Google client ID', () => {
    render(<GoogleSignInButton clientId="" pending={false} onCredential={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeDisabled();
  });

  it('passes the Google ID credential to the login flow', async () => {
    const onCredential = vi.fn();
    let callback: ((response: { credential: string }) => void) | undefined;
    const renderButton = vi.fn();
    Object.assign(window, {
      google: { accounts: { id: {
        initialize: vi.fn((options: { callback: typeof callback }) => { callback = options.callback; }),
        renderButton
      } } }
    });

    render(<GoogleSignInButton clientId="client-id" pending={false} onCredential={onCredential} />);
    await waitFor(() => expect(renderButton).toHaveBeenCalledOnce());
    callback?.({ credential: 'google-id-token' });

    expect(onCredential).toHaveBeenCalledWith('google-id-token');
  });
});
