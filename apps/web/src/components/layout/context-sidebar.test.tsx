import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
vi.mock('next/navigation', () => ({ usePathname: () => '/calendar' }));
import { ContextSidebar } from '@/components/layout/context-sidebar';

describe('ContextSidebar', () => {
  it('renders Planner-specific navigation for the active global module', () => {
    render(<ContextSidebar />);
    expect(screen.getByRole('heading', { name: 'Planner' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Calendar' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Schedule' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Focus' })).toBeInTheDocument();
  });
});