import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DeleteConfirmationDialog } from './delete-confirmation-dialog';

describe('DeleteConfirmationDialog', () => {
  afterEach(cleanup);

  it('confirms a destructive action from an accessible modal', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<DeleteConfirmationDialog open title="Delete Space?" itemName="Demo Workspace" description="All content will be archived." confirmLabel="Delete Space" onOpenChange={vi.fn()} onConfirm={onConfirm} />);

    expect(screen.getByRole('dialog', { name: 'Delete Demo Workspace' })).toBeInTheDocument();
    expect(screen.getByText('All content will be archived.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete Space' }));

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('closes without deleting when Cancel is selected', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();
    render(<DeleteConfirmationDialog open title="Delete List?" itemName="Backlog" description="Tasks will be archived." onOpenChange={onOpenChange} onConfirm={onConfirm} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
