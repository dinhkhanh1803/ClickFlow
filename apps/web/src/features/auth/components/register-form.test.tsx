import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithQueryClient } from '@/test/render';
import { RegisterForm } from './register-form';
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe('RegisterForm', () => {
  it('registers through the email verification endpoint and shows the inbox state', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ accepted: true, email: 'person@example.com' }), { status: 201, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderWithQueryClient(<RegisterForm />);
    await user.type(screen.getByLabelText('Full name'), 'Khanh Tran');
    await user.type(screen.getByLabelText('Email address'), 'person@example.com');
    await user.type(screen.getByLabelText('Password'), 'Strong-Pass-10!');
    await user.type(screen.getByLabelText('Confirm password'), 'Strong-Pass-10!');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/auth\/register-email$/), expect.objectContaining({ method: 'POST' }));
  });
});
