import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CreationDialog } from './creation-dialog';

afterEach(cleanup);

describe('CreationDialog', () => {
  it('defaults Space creation to public view access with a description field', async () => {
    const user = userEvent.setup();
    const onPrivateChange = vi.fn();
    const onPublicAccessChange = vi.fn();
    render(<CreationDialog kind="space" open name="" description="" isPrivate={false} publicAccess="VIEW" invitees="" onNameChange={vi.fn()} onDescriptionChange={vi.fn()} onPrivateChange={onPrivateChange} onPublicAccessChange={onPublicAccessChange} onInviteesChange={vi.fn()} onOpenChange={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Create Space' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Public/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Private/ })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByLabelText('Space description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View only/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Can edit/ })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByLabelText('Invite people by email')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Private/ }));
    expect(onPrivateChange).toHaveBeenCalledWith(true);
    await user.click(screen.getByRole('button', { name: /Can edit/ }));
    expect(onPublicAccessChange).toHaveBeenCalledWith('EDIT');
  });

  it('keeps Folder creation focused on its parent and metadata', () => {
    render(<CreationDialog kind="folder" open name="Roadmap" description="" isPrivate={false} publicAccess="VIEW" invitees="" parentLabel="Product" onNameChange={vi.fn()} onDescriptionChange={vi.fn()} onPrivateChange={vi.fn()} onPublicAccessChange={vi.fn()} onInviteesChange={vi.fn()} onOpenChange={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByText(/Creating in/)).toHaveTextContent('Product');
    expect(screen.getByLabelText('Folder description')).toBeInTheDocument();
    expect(screen.queryByText('Access')).not.toBeInTheDocument();
  });
});
