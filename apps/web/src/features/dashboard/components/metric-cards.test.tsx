import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCards } from '@/features/dashboard/components/metric-cards';

describe('MetricCards', () => {
  it('renders typed dashboard metrics', () => {
    render(<MetricCards metrics={[{ label: 'Open tasks', value: '4' }]} />);
    expect(screen.getByText('Open tasks')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});