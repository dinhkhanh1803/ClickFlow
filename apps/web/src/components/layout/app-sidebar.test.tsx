import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
vi.mock('next/navigation', () => ({ usePathname: () => '/projects' }));
import { AppSidebar } from '@/components/layout/app-sidebar';

describe('AppSidebar', () => {
  it('renders Dashboard navigation, a Create New action, and the active route', () => {
    render(<AppSidebar />);
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create New' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveClass('bg-indigo-50');
  });
});