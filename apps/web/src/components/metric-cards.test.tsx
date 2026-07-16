import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCards } from '@/components/metric-cards';

describe('MetricCards', () => {
  it('renders typed dashboard metrics', () => {
    render(<MetricCards metrics={[{ label: 'Active Projects', value: '4', tone: 'indigo' }]} />);
    expect(screen.getByText('Active Projects')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});