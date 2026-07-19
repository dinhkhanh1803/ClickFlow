import { ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../database/prisma.service';
import { createWorkspaceSchema } from './workspace.schemas';
import { WorkspaceService } from './workspace.service';

describe('WorkspaceService', () => {
  it('normalizes creation input and applies safe defaults', () => {
    expect(createWorkspaceSchema.parse({ name: '  Booking  ' })).toEqual({
      name: 'Booking',
      private: true,
      timezone: 'UTC',
      locale: 'en'
    });
  });

  it('keeps Spaces in creation order so settings updates do not move them', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const service = new WorkspaceService({ workspaceMember: { findMany } } as unknown as PrismaService);

    await service.listForUser('user-1');

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: [{ workspace: { createdAt: 'asc' } }, { workspaceId: 'asc' }]
    }));
  });
  it('creates the workspace and OWNER membership in one transaction', async () => {
    const createdAt = new Date('2026-07-19T00:00:00.000Z');
    const workspace = {
      id: '00000000-0000-4000-8000-000000000020',
      name: 'Booking',
      tone: null,
      private: true,
      timezone: 'UTC',
      locale: 'en',
      createdAt,
      updatedAt: createdAt
    };
    const transaction = {
      workspace: { create: vi.fn().mockResolvedValue(workspace) },
      workspaceMember: { create: vi.fn().mockResolvedValue({ id: 'membership-1' }) }
    };
    const prisma = {
      $transaction: vi.fn((callback: (client: typeof transaction) => unknown) => callback(transaction))
    };
    const service = new WorkspaceService(prisma as unknown as PrismaService);

    await expect(service.create('00000000-0000-4000-8000-000000000001', {
      name: 'Booking',
      private: true,
      timezone: 'UTC',
      locale: 'en'
    })).resolves.toEqual({ ...workspace, role: 'OWNER' });
    const workspaceInput = transaction.workspace.create.mock.calls[0]?.[0] as unknown as { data: { createdById: string; name: string } };
    const membershipInput = transaction.workspaceMember.create.mock.calls[0]?.[0] as unknown as { data: { workspaceId: string; userId: string; role: string } };
    expect(workspaceInput.data).toMatchObject({ createdById: '00000000-0000-4000-8000-000000000001', name: 'Booking' });
    expect(membershipInput.data).toMatchObject({ workspaceId: workspace.id, role: 'OWNER' });
  });
  it('allows only an OWNER to update Space settings', async () => {
    const updated = { id: 'workspace-1', name: 'Design', tone: 'appearance:target|bg-emerald-500', private: false };
    const prisma = {
      workspaceMember: { findUnique: vi.fn().mockResolvedValue({ role: 'OWNER' }) },
      workspace: { update: vi.fn().mockResolvedValue(updated) }
    };
    const service = new WorkspaceService(prisma as unknown as PrismaService);

    await expect(service.update('workspace-1', 'owner-1', { name: 'Design', private: false, tone: 'appearance:target|bg-emerald-500' })).resolves.toMatchObject({ ...updated, role: 'OWNER' });
    expect(prisma.workspace.update).toHaveBeenCalledWith(expect.objectContaining({ data: { name: 'Design', private: false, tone: 'appearance:target|bg-emerald-500' } }));

    prisma.workspaceMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
    await expect(service.update('workspace-1', 'member-1', { name: 'Blocked' })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows only an OWNER to archive an active Space', async () => {
    const prisma = {
      workspaceMember: { findUnique: vi.fn().mockResolvedValue({ role: 'OWNER' }) },
      workspace: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) }
    };
    const service = new WorkspaceService(prisma as unknown as PrismaService);

    await expect(service.archive('workspace-1', 'owner-1')).resolves.toBeUndefined();
    const archiveInput = prisma.workspace.updateMany.mock.calls[0]?.[0] as unknown as { where: { id: string; archivedAt: null }; data: { archivedAt: Date } };
    expect(archiveInput.where).toEqual({ id: 'workspace-1', archivedAt: null });
    expect(archiveInput.data.archivedAt).toBeInstanceOf(Date);

    prisma.workspaceMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
    await expect(service.archive('workspace-1', 'member-1')).rejects.toBeInstanceOf(ForbiddenException);
  });
});
