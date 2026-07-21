import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { GlobalSearchDialog } from './global-search-dialog';

describe('GlobalSearchDialog', () => {
  afterEach(() => { cleanup(); window.localStorage.clear(); });

  it('renders only ClickFlow search controls', () => {
    render(<GlobalSearchDialog open onOpenChange={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Search ClickFlow' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tasks' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Docs' })).toBeInTheDocument();
    expect(screen.queryByText('Google Drive')).not.toBeInTheDocument();
    expect(screen.queryByText('Ask AI')).not.toBeInTheDocument();
  });
});