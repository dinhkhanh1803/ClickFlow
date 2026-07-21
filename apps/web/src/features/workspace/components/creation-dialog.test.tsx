import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CreationDialog } from './creation-dialog';

afterEach(cleanup);

describe('CreationDialog', () => {
  it('shows fixed public edit access for Space creation', () => {
    render(<CreationDialog kind="space" open name="" description="" isPrivate={false} publicAccess="EDIT" invitees="" onNameChange={vi.fn()} onDescriptionChange={vi.fn()} onPrivateChange={vi.fn()} onPublicAccessChange={vi.fn()} onInviteesChange={vi.fn()} onOpenChange={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Create Space' })).toBeInTheDocument();
    expect(screen.getByLabelText('Space description')).toBeInTheDocument();
    expect(screen.getByText('New Spaces are public to signed-in users and editable by default.')).toBeInTheDocument();
    expect(screen.getByText('Public')).toBeInTheDocument();
    expect(screen.getByText('Can edit')).toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: 'Access visibility' })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Public permissions' })).not.toBeInTheDocument();
    expect(screen.queryByText('View only')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Invite people by email')).not.toBeInTheDocument();
  });

  it('keeps Folder creation focused on its parent and metadata', () => {
    render(<CreationDialog kind="folder" open name="Roadmap" description="" isPrivate={false} publicAccess="EDIT" invitees="" parentLabel="Product" onNameChange={vi.fn()} onDescriptionChange={vi.fn()} onPrivateChange={vi.fn()} onPublicAccessChange={vi.fn()} onInviteesChange={vi.fn()} onOpenChange={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByText(/Creating in/)).toHaveTextContent('Product');
    expect(screen.getByLabelText('Folder description')).toBeInTheDocument();
    expect(screen.queryByText('Access')).not.toBeInTheDocument();
  });
});