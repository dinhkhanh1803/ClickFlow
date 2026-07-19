import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard' }));
vi.mock('@/features/auth/components/logout-button', () => ({ LogoutButton: () => <button type="button" role="menuitem">Log out</button> }));
vi.mock('@/features/workspace/data/workspace-queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/workspace/data/workspace-queries')>();
  return { ...actual,
  useWorkspaceNavigationQuery: () => ({
    activities: [
      { id: 'activity-1', eventType: 'COMMENT_CREATED', subjectType: 'TASK', subjectId: 'task-1', metadata: {}, actor: { id: 'user-2', displayName: 'Minh', initials: 'M', avatarUrl: null }, createdAt: '2026-07-19T02:55:00.000Z' },
      { id: 'activity-2', eventType: 'TASK_UPDATED', subjectType: 'TASK', subjectId: 'task-1', metadata: {}, actor: null, createdAt: '2026-07-19T02:50:00.000Z' },
    ],
    tasks: [{ id: 'task-1', workspaceId: 'workspace-1', projectId: 'project-1', title: 'Launch checklist', assigneeId: 'anonymous' }],
    isLoading: false,
  }),
}; });

import { AppHeader, AppShell } from '@/components/layout/app-shell';

afterEach(() => { cleanup(); window.localStorage.clear(); });

describe('AppHeader', () => {
  it('pins the application header above scrolling content', () => {
    render(<AppHeader />);

    expect(screen.getByRole('banner')).toHaveClass('sticky', 'top-0', 'z-30');
  });
  it('opens the ClickFlow command palette from the search control', async () => {
    const user = userEvent.setup();
    render(<AppHeader />);

    await user.click(screen.getByRole('button', { name: 'Search ClickFlow' }));

    expect(screen.getByRole('dialog', { name: 'Search ClickFlow' })).toBeInTheDocument();
  });
  it('opens the avatar menu', async () => {
    const user = userEvent.setup();
    render(<AppHeader />);
    await user.click(screen.getByRole('button', { name: 'Open account menu' }));
    expect(screen.getByRole('menu')).toHaveTextContent('Profile');
  });

  it('opens notifications and marks all items as read', async () => {
    const user = userEvent.setup();
    render(<AppHeader />);

    await user.click(screen.getByRole('button', { name: 'Notifications (2 unread)' }));
    expect(screen.getByRole('dialog', { name: 'Notifications' })).toHaveTextContent('2 unread');

    await user.click(screen.getByRole('button', { name: 'Mark all as read' }));

    expect(screen.getByRole('dialog', { name: 'Notifications' })).toHaveTextContent('You are all caught up');
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('dismisses notifications on outside press', async () => {
    const user = userEvent.setup();
    render(<AppHeader />);

    await user.click(screen.getByRole('button', { name: 'Notifications (2 unread)' }));
    await user.pointer({ keys: '[MouseLeft]', target: document.body });

    expect(screen.queryByRole('dialog', { name: 'Notifications' })).not.toBeInTheDocument();
  });
  it('links account menu entries to Profile and Workspace settings and dismisses on outside press', async () => {
    const user = userEvent.setup();
    render(<AppHeader />);

    await user.click(screen.getByRole('button', { name: 'Open account menu' }));
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/profile');
    expect(screen.getByRole('link', { name: 'Workspace settings' })).toHaveAttribute('href', '/workspace-settings');

    await user.pointer({ keys: '[MouseLeft]', target: document.body });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
  it('offers the authenticated logout action', async () => {
    const user = userEvent.setup();
    render(<AppHeader />);

    await user.click(screen.getByRole('button', { name: 'Open account menu' }));

    expect(screen.getByRole('menuitem', { name: 'Log out' })).toBeInTheDocument();
  });

  it('overlays a preview panel on hover without replacing the route panel', async () => {
    const user = userEvent.setup();
    render(<AppShell><div>Dashboard content</div></AppShell>);
    const planner = screen.getByRole('link', { name: 'Planner' });

    await user.hover(planner);
    expect(screen.getByRole('complementary', { name: 'Home navigation' })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Planner preview' })).toBeInTheDocument();

    await user.unhover(planner);
    expect(screen.queryByRole('complementary', { name: 'Planner preview' })).not.toBeInTheDocument();
  });

  it('closes the preview when its global rail item is clicked', async () => {
    const user = userEvent.setup();
    render(<AppShell><div>Dashboard content</div></AppShell>);
    const planner = screen.getByRole('link', { name: 'Planner' });

    planner.addEventListener('click', (event) => event.preventDefault());
    await user.hover(planner);
    await user.click(planner);

    expect(screen.queryByRole('complementary', { name: 'Planner preview' })).not.toBeInTheDocument();
  });

  it('reopens a collapsed panel only when a global menu item is clicked', async () => {
    const user = userEvent.setup();
    render(<AppShell><div>Dashboard content</div></AppShell>);
    const planner = screen.getByRole('link', { name: 'Planner' });
    planner.addEventListener('click', (event) => event.preventDefault());

    await user.click(screen.getByRole('button', { name: 'Collapse panel' }));
    expect(screen.queryByRole('complementary', { name: 'Home navigation' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Expand panel' })).not.toBeInTheDocument();

    await user.click(planner);
    expect(screen.getByRole('complementary', { name: 'Home navigation' })).toBeInTheDocument();
  });
  it('pins the Space navigation panel while workspace content scrolls', () => {
    render(<AppShell><div className="min-h-[200vh]">Long workspace content</div></AppShell>);

    expect(screen.getByRole('complementary', { name: 'Home navigation' }).parentElement).toHaveClass('sticky', 'top-0', 'self-start');
  });
});