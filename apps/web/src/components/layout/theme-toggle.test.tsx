import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeToggle } from '@/components/layout/theme-toggle';

describe('ThemeToggle', () => {
  it('exposes an accessible theme control', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: 'Toggle theme' })).toBeInTheDocument();
  });
});
