import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
vi.mock('next/navigation', () => ({ usePathname: () => '/projects' }));
import { AppSidebar } from '@/components/layout/app-sidebar';

const modules = ['Home', 'Spaces', 'My Tasks', 'Planner', 'Time', 'Reports', 'Settings'];

describe('AppSidebar', () => {
  it('renders the seven core global modules and marks Spaces active', () => {
    render(<AppSidebar />);
    expect(screen.getByLabelText('Global navigation')).toBeInTheDocument();
    modules.forEach(label => expect(screen.getByRole('link', { name: label })).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Spaces' })).toHaveAttribute('aria-current', 'page');
  });
});