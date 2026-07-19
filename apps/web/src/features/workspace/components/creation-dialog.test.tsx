import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CreationDialog } from './creation-dialog';

afterEach(cleanup);

describe('CreationDialog', () => {
  it('shows private access and invite controls for a Space', async () => {
    const user = userEvent.setup();
    const onPrivateChange = vi.fn();
    render(<CreationDialog kind="space" open name="" description="" isPrivate invitees="" onNameChange={vi.fn()} onDescriptionChange={vi.fn()} onPrivateChange={onPrivateChange} onInviteesChange={vi.fn()} onOpenChange={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Create Space' })).toBeInTheDocument();
    expect(screen.getByLabelText('Invite people by email')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Public/ }));
    expect(onPrivateChange).toHaveBeenCalledWith(false);
  });

  it('keeps Folder creation focused on its parent and metadata', () => {
    render(<CreationDialog kind="folder" open name="Roadmap" description="" isPrivate={false} invitees="" parentLabel="Product" onNameChange={vi.fn()} onDescriptionChange={vi.fn()} onPrivateChange={vi.fn()} onInviteesChange={vi.fn()} onOpenChange={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByText(/Creating in/)).toHaveTextContent('Product');
    expect(screen.getByLabelText('Folder description')).toBeInTheDocument();
    expect(screen.queryByText('Access')).not.toBeInTheDocument();
  });
});
