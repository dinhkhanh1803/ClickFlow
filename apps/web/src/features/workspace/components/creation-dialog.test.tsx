import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CreationDialog } from './creation-dialog';

afterEach(cleanup);

describe('CreationDialog', () => {
  it('defaults Space creation to public edit access with a toggle and permissions dropdown', async () => {
    const user = userEvent.setup();
    const onPrivateChange = vi.fn();
    const onPublicAccessChange = vi.fn();
    render(<CreationDialog kind="space" open name="" description="" isPrivate={false} publicAccess="EDIT" invitees="" onNameChange={vi.fn()} onDescriptionChange={vi.fn()} onPrivateChange={onPrivateChange} onPublicAccessChange={onPublicAccessChange} onInviteesChange={vi.fn()} onOpenChange={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Create Space' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Access visibility' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByLabelText('Space description')).toBeInTheDocument();
    const publicPermissions = screen.getByRole('combobox', { name: 'Public permissions' });
    expect(publicPermissions).toHaveValue('EDIT');
    expect(screen.getByRole('option', { name: 'Can edit' })).toHaveClass('text-slate-900');
    expect(screen.getByRole('option', { name: 'View only' })).toHaveClass('text-slate-900');
    expect(screen.queryByLabelText('Invite people by email')).not.toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: 'Access visibility' }));
    expect(onPrivateChange).toHaveBeenCalledWith(true);
    await user.selectOptions(publicPermissions, 'VIEW');
    expect(onPublicAccessChange).toHaveBeenCalledWith('VIEW');
  });

  it('keeps Folder creation focused on its parent and metadata', () => {
    render(<CreationDialog kind="folder" open name="Roadmap" description="" isPrivate={false} publicAccess="EDIT" invitees="" parentLabel="Product" onNameChange={vi.fn()} onDescriptionChange={vi.fn()} onPrivateChange={vi.fn()} onPublicAccessChange={vi.fn()} onInviteesChange={vi.fn()} onOpenChange={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByText(/Creating in/)).toHaveTextContent('Product');
    expect(screen.getByLabelText('Folder description')).toBeInTheDocument();
    expect(screen.queryByText('Access')).not.toBeInTheDocument();
  });
});