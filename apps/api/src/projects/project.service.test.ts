import { describe, expect, it, vi } from 'vitest';

import { ProjectService } from './project.service';

describe('ProjectService', () => {
  it('creates the default Task workflow in the Project transaction', async () => {
    const created = {
      id: 'project-1',
      workspaceId: 'workspace-1',
      name: 'Launch',
      description: null,
      tone: null,
      position: 0,
      deadline: null,
      createdAt: new Date('2026-07-19T00:00:00.000Z'),
      updatedAt: new Date('2026-07-19T00:00:00.000Z'),
      archivedAt: null
    };
    const transaction = {
      project: {
        aggregate: vi.fn().mockResolvedValue({ _max: { position: null } }),
        create: vi.fn().mockResolvedValue(created)
      },
      taskStatus: { createMany: vi.fn().mockResolvedValue({ count: 3 }) },
      activityLog: { create: vi.fn().mockResolvedValue({ id: 'activity-1' }) }
    };
    const prisma = { $transaction: vi.fn((callback: (client: typeof transaction) => unknown) => callback(transaction)) };
    const health = { getForProject: vi.fn().mockResolvedValue({ totalTasks: 0, completedTasks: 0, overdueTasks: 0, progressPercent: 0, health: 'ON_TRACK' }) };
    const service = new ProjectService(prisma as never, health as never);

    await service.create('workspace-1', 'user-1', { name: 'Launch' }, { requestId: 'request-1' });

    expect(transaction.taskStatus.createMany).toHaveBeenCalledWith({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: expect.arrayContaining([
        expect.objectContaining({ name: 'Open', isSystem: true, position: 0, projectId: created.id }),
        expect.objectContaining({ name: 'In progress', isSystem: true, position: 1, projectId: created.id }),
        expect.objectContaining({ name: 'Complete', isSystem: true, position: 2, projectId: created.id, completed: true })
      ])
    });
  });
});
