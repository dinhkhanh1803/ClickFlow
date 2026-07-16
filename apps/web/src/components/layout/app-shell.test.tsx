import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard' }));

import { AppHeader, AppShell } from '@/components/layout/app-shell';

afterEach(cleanup);

describe('AppHeader', () => {
  it('opens the avatar menu', async () => {
    const user = userEvent.setup();
    render(<AppHeader />);
    await user.click(screen.getByRole('button', { name: 'Open account menu' }));
    expect(screen.getByRole('menu')).toHaveTextContent('Profile');
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
});