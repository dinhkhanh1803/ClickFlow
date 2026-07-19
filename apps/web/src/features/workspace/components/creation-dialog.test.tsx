import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CreationDialog } from './creation-dialog';

afterEach(cleanup);

describe('CreationDialog', () => {
  it('defaults Space creation to public access without a description', async () => {
    const user = userEvent.setup();
    const onPrivateChange = vi.fn();
    render(<CreationDialog kind="space" open name="" description="" isPrivate={false} invitees="" onNameChange={vi.fn()} onDescriptionChange={vi.fn()} onPrivateChange={onPrivateChange} onInviteesChange={vi.fn()} onOpenChange={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Create Space' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Public/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Private/ })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByLabelText('Space description')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Invite people by email')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Private/ }));
    expect(onPrivateChange).toHaveBeenCalledWith(true);
  });

  it('keeps Folder creation focused on its parent and metadata', () => {
    render(<CreationDialog kind="folder" open name="Roadmap" description="" isPrivate={false} invitees="" parentLabel="Product" onNameChange={vi.fn()} onDescriptionChange={vi.fn()} onPrivateChange={vi.fn()} onInviteesChange={vi.fn()} onOpenChange={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByText(/Creating in/)).toHaveTextContent('Product');
    expect(screen.getByLabelText('Folder description')).toBeInTheDocument();
    expect(screen.queryByText('Access')).not.toBeInTheDocument();
  });
});
