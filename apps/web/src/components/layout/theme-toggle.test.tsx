import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { ThemeToggle } from '@/components/layout/theme-toggle';

describe('ThemeToggle', () => {
  it('scopes dark Tailwind variants to the application theme class', () => {
    const globals = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8');

    expect(globals).toContain('@custom-variant dark (&:where(.dark, .dark *));');
  });

  it('renders a deterministic theme control during server rendering', () => {
    const html = renderToString(<ThemeToggle />);

    expect(html).toContain('title="Change theme"');
    expect(html).not.toContain('Switch to');
  });
  it('exposes an accessible theme control', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: 'Toggle theme' })).toBeInTheDocument();
  });
});
