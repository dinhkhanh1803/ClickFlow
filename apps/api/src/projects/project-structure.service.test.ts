import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { ProjectStructureService } from './project-structure.service';

describe('ProjectStructureService status protection', () => {
  it('rejects deletion of a system default status before changing tasks', async () => {
    const prisma = {
      taskStatus: { findFirst: vi.fn().mockResolvedValue({ id: 'status-open', isSystem: true }) },
      task: { count: vi.fn() },
      $transaction: vi.fn(),
    };
    const service = new ProjectStructureService(prisma as never);

    await expect(service.deleteStatus('workspace-1', 'project-1', 'status-open', 'user-1', {}, {}))
      .rejects.toThrow(ConflictException);
    expect(prisma.task.count).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('deletes a custom status and moves its tasks to the requested replacement', async () => {
    const transaction = {
      task: { updateMany: vi.fn().mockResolvedValue({ count: 2 }) },
      taskStatus: { delete: vi.fn().mockResolvedValue({ id: 'status-review' }) },
      activityLog: { create: vi.fn().mockResolvedValue({ id: 'activity-1' }) },
    };
    const prisma = {
      taskStatus: { findFirst: vi.fn()
        .mockResolvedValueOnce({ id: 'status-review', isSystem: false })
        .mockResolvedValueOnce({ id: 'status-open' }) },
      task: { count: vi.fn().mockResolvedValue(2) },
      $transaction: vi.fn((callback: (client: typeof transaction) => unknown) => callback(transaction)),
    };
    const service = new ProjectStructureService(prisma as never);

    await service.deleteStatus('workspace-1', 'project-1', 'status-review', 'user-1', { replacementStatusId: 'status-open' }, {});

    expect(transaction.task.updateMany).toHaveBeenCalledWith({
      where: { workspaceId: 'workspace-1', projectId: 'project-1', statusId: 'status-review' },
      data: { statusId: 'status-open' },
    });
    expect(transaction.taskStatus.delete).toHaveBeenCalledWith({ where: { id: 'status-review' } });
  });
});
