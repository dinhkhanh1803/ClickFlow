import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LOCAL_SPACES_STORAGE_KEY } from '@/features/workspace/model/local-navigation';
vi.mock('next/navigation', () => ({ usePathname: () => '/calendar' }));
import { ContextSidebar } from '@/components/layout/context-sidebar';

describe('ContextSidebar', () => {
  afterEach(() => window.localStorage.clear());

  it('renders Planner-specific navigation for the active global module', () => {
    render(<ContextSidebar />);
    expect(screen.getByRole('heading', { name: 'Planner' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Calendar' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Schedule' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Focus' })).toBeInTheDocument();
  });

  it('creates a Space locally from the Spaces menu', async () => {
    const user = userEvent.setup();
    render(<ContextSidebar modulePath="/projects" />);

    await user.click(screen.getByLabelText('Create space'));
    await user.click(screen.getByRole('menuitem', { name: /Space Organize your team work/ }));
    await user.type(screen.getByLabelText('Space name'), 'Marketing');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(screen.getByRole('link', { name: 'Marketing Private' })).toBeInTheDocument();
    expect(window.localStorage.getItem(LOCAL_SPACES_STORAGE_KEY)).toContain('Marketing');
  });

  it('creates a List inside a Project folder from its plus button', async () => {
    const user = userEvent.setup();
    render(<ContextSidebar modulePath="/projects" />);

    await user.click(screen.getByRole('button', { name: 'Create list in Projects' }));
    await user.type(screen.getByLabelText('list name'), 'Sprint planning');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(screen.getByRole('button', { name: 'Sprint planning' })).toBeInTheDocument();
    expect(window.localStorage.getItem(LOCAL_SPACES_STORAGE_KEY)).toContain('folder-projects');
  });

  it('shows project actions from the more menu', async () => {
    const user = userEvent.setup();
    render(<ContextSidebar modulePath="/projects" />);

    await user.click(screen.getByRole('button', { name: 'More options for Projects' }));

    expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
  });
});