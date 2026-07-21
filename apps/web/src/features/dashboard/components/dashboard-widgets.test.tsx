import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardWidgets } from '@/features/dashboard/components/dashboard-widgets';

describe('DashboardWidgets', () => {
  it('renders only workspace-derived progress and deadlines', () => {
    render(<DashboardWidgets folderProgress={[{ id: 'folder-1', name: 'Product', completed: 2, total: 4, progress: 50 }]} deadlines={[{ id: 'task-1', title: 'Ship dashboard', dueDate: '2026-07-17', listName: 'Web', spaceName: 'Product', status: 'TO DO', priority: 'High', assignee: '', startDate: '', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], attachments: [], createdAt: '2026-07-17T08:00:00.000Z' }]} />);

    expect(screen.getByRole('heading', { name: 'Folder progress' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Upcoming deadlines' })).toBeInTheDocument();
    expect(screen.getByText('Ship dashboard')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Weekly Hours' })).not.toBeInTheDocument();
  });
});