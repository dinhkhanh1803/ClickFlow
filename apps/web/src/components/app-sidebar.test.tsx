import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppSidebar } from '@/components/app-sidebar';

describe('AppSidebar', () => {
  it('renders Dashboard navigation and a Create New action', () => {
    render(<AppSidebar />);
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create New' })).toBeInTheDocument();
  });
});
