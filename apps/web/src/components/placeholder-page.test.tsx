import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PlaceholderPage } from '@/components/placeholder-page';

describe('PlaceholderPage', () => {
  it('offers loading, empty, and error UI states', () => {
    render(<PlaceholderPage title="Projects" description="Manage work" />);
    fireEvent.click(screen.getByRole('button', { name: 'Loading state' }));
    expect(screen.getByRole('heading', { name: 'Loading data' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Fetching the latest mock workspace data.');
    fireEvent.click(screen.getByRole('button', { name: 'Empty state' }));
    expect(screen.getByRole('heading', { name: 'Nothing here yet' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Error state' }));
    expect(screen.getByRole('heading', { name: 'Unable to load this view' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('recovery affordances');
  });
});