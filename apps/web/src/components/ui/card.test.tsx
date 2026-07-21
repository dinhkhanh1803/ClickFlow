import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '@/components/ui/card';

describe('Card', () => {
  it('uses the shared glass surface treatment', () => {
    render(<Card data-testid="surface">Content</Card>);
    expect(screen.getByTestId('surface')).toHaveClass('glass-surface');
  });
});