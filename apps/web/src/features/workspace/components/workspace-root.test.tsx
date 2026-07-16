import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspaceRoot } from '@/features/workspace/components/workspace-root';

afterEach(cleanup);

describe('WorkspaceRoot', () => {
  it('creates a project and opens it from the Space overview', async () => {
    const user = userEvent.setup();
    render(<WorkspaceRoot />);

    await user.click(screen.getByRole('button', { name: 'New project' }));
    await user.type(screen.getByLabelText('Project name'), 'Marketing launch');
    await user.click(screen.getByRole('button', { name: 'Create project' }));

    expect(screen.getByRole('heading', { name: 'Marketing launch' })).toBeInTheDocument();
  });
  it('edits a project from its workspace header', async () => {
    const user = userEvent.setup();
    render(<WorkspaceRoot initialProjectId="project-product-launch" />);

    await user.click(screen.getByRole('button', { name: 'Project settings' }));
    const name = screen.getByLabelText('Project name');
    await user.clear(name);
    await user.type(name, 'Launch system');
    await user.click(screen.getByRole('button', { name: 'Save project' }));

    expect(screen.getByRole('heading', { name: 'Launch system' })).toBeInTheDocument();
  });
  it('keeps task status in sync with the board', async () => {
    const user = userEvent.setup();
    render(<WorkspaceRoot initialProjectId="project-product-launch" />);

    await user.click(screen.getByRole('button', { name: 'Define information architecture' }));
    await user.selectOptions(screen.getByLabelText('Status'), 'Done');

    expect(screen.getByLabelText('Done tasks')).toHaveTextContent('Define information architecture');
  });

  it('records checklist work and a comment in the task inspector', async () => {
    const user = userEvent.setup();
    render(<WorkspaceRoot initialProjectId="project-product-launch" />);

    await user.click(screen.getByRole('button', { name: 'Define information architecture' }));
    await user.click(screen.getByRole('checkbox', { name: 'Map navigation hierarchy' }));
    await user.type(screen.getByLabelText('Comment'), 'Navigation structure approved.');
    await user.click(screen.getByRole('button', { name: 'Post comment' }));

    expect(screen.getByRole('checkbox', { name: 'Map navigation hierarchy' })).toBeChecked();
    expect(screen.getByText('Navigation structure approved.')).toBeInTheDocument();
  });
  it('keeps the compact workspace overview frame while using live projects', () => {
    render(<WorkspaceRoot />);

    expect(screen.getByRole('heading', { name: 'Recent' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Docs' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bookmarks' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Folders' })).toBeInTheDocument();
  });
  it('switches the Space tab content without leaving the Space frame', async () => {
    const user = userEvent.setup();
    render(<WorkspaceRoot />);

    await user.click(screen.getByRole('tab', { name: 'Board' }));

    expect(screen.getByRole('tab', { name: 'Board' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: 'Space Board' })).toBeInTheDocument();
    expect(screen.getByText('ClickFlow Product')).toBeInTheDocument();
  });
  it('does not show Add Channel in the Space tab bar', () => {
    render(<WorkspaceRoot />);

    expect(screen.queryByRole('button', { name: 'Add Channel' })).not.toBeInTheDocument();
  });
});