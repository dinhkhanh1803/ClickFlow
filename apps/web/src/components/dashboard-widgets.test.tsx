import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardWidgets } from '@/components/dashboard-widgets';

const data = {
  weeklyHours: [6, 8, 10, 12, 7, 4, 2],
  deadlines: [{ id: 'd1', title: 'Client demo: Portfolio', due: 'Today, 6:00 PM', tone: 'urgent' as const }],
  projectHealth: [{ id: 'p1', name: 'Freelancer Portfolio', progress: 65, health: 'on-track' as const }],
};

describe('DashboardWidgets', () => {
  it('renders weekly hours, deadlines, and project health from typed mock data', () => {
    render(<DashboardWidgets {...data} />);
    expect(screen.getByRole('heading', { name: 'Weekly Hours' })).toBeInTheDocument();
    expect(screen.getByText('Client demo: Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Freelancer Portfolio')).toBeInTheDocument();
  });
});