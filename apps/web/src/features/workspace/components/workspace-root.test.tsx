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
  it('renders the Space Board with ClickUp-style status controls and compact columns', async () => {
    const user = userEvent.setup();
    render(<WorkspaceRoot />);

    await user.click(screen.getByRole('tab', { name: 'Board' }));

    expect(screen.getByRole('button', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByText('TO DO')).toBeInTheDocument();
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
    expect(screen.getByText('COMPLETE')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add group' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Add task in/ })).toHaveLength(3);
  });
  it('groups the Space List by project and status', async () => {
    const user = userEvent.setup();
    render(<WorkspaceRoot />);

    await user.click(screen.getByRole('tab', { name: 'List' }));

    expect(screen.getByRole('heading', { name: 'Space List' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Product launch' })).toBeInTheDocument();
    expect(screen.getByText('Assignee')).toBeInTheDocument();
    expect(screen.getByText('Due date')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Define information architecture' })).toBeInTheDocument();
  });
  it('opens a task detail modal from the Space List without navigating to the project workspace', async () => {
    const user = userEvent.setup();
    render(<WorkspaceRoot />);

    await user.click(screen.getByRole('tab', { name: 'List' }));
    await user.click(screen.getByRole('button', { name: 'Define information architecture' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Task title')).toHaveValue('Define information architecture');
    await user.click(screen.getByRole('button', { name: 'Enter full screen' }));
    expect(screen.getByRole('button', { name: 'Exit full screen' })).toBeInTheDocument();
    expect(screen.queryByText('Project workspace')).not.toBeInTheDocument();
  });
  it('shows a ClickUp-style icon on every Space view tab in the expected order', () => {
    render(<WorkspaceRoot />);

    const expectedViews = ['Overview', 'Board', 'List', 'Calendar', 'Table', 'Gantt'];
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(expectedViews);

    expectedViews.forEach((view) => {
      expect(screen.getByRole('tab', { name: view }).querySelector('svg')).toBeInTheDocument();
    });
  });
  it('does not show Add Channel in the Space tab bar', () => {
    render(<WorkspaceRoot />);

    expect(screen.queryByRole('button', { name: 'Add Channel' })).not.toBeInTheDocument();
  });
});