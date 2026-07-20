import { ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../database/prisma.service';
import { createWorkspaceSchema } from './workspace.schemas';
import { WorkspaceService } from './workspace.service';

describe('WorkspaceService', () => {
  it('normalizes creation input and applies safe defaults', () => {
    expect(createWorkspaceSchema.parse({ name: '  Booking  ', description: '  Team planning  ', private: false, publicAccess: 'EDIT' })).toEqual({
      name: 'Booking',
      description: 'Team planning',
      private: false,
      publicAccess: 'EDIT',
      timezone: 'UTC',
      locale: 'en'
    });
  });

  it('keeps Spaces in creation order so settings updates do not move them', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const service = new WorkspaceService({ workspaceMember: { findMany }, workspace: { findMany: vi.fn().mockResolvedValue([]) } } as unknown as PrismaService);

    await service.listForUser('user-1');

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: [{ workspace: { createdAt: 'asc' } }, { workspaceId: 'asc' }]
    }));
  });

  it('lists owned and public Spaces with creator metadata for a signed-in user', async () => {
    const createdAt = new Date('2026-07-19T00:00:00.000Z');
    const privateMemberships = [{
      role: 'OWNER',
      workspace: {
        id: 'workspace-owned', name: 'Owned', description: null, tone: null, private: true, publicAccess: 'VIEW', timezone: 'UTC', locale: 'en',
        createdBy: { id: 'user-a', displayName: 'Owner A', avatarUrl: null }, createdAt, updatedAt: createdAt
      }
    }];
    const publicWorkspaces = [{
      id: 'workspace-public', name: 'Public', description: 'Visible to everyone', tone: null, private: false, publicAccess: 'EDIT', timezone: 'UTC', locale: 'en',
      createdBy: { id: 'user-b', displayName: 'Owner B', avatarUrl: null }, createdAt, updatedAt: createdAt, members: []
    }];
    const prisma = {
      workspaceMember: { findMany: vi.fn().mockResolvedValue(privateMemberships) },
      workspace: { findMany: vi.fn().mockResolvedValue(publicWorkspaces) }
    };
    const service = new WorkspaceService(prisma as unknown as PrismaService);

    await expect(service.listForUser('user-a')).resolves.toEqual([
      { ...privateMemberships[0]!.workspace, role: 'OWNER' },
      { ...publicWorkspaces[0], role: 'PUBLIC', members: undefined }
    ]);
    expect(prisma.workspace.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { archivedAt: null, private: false, members: { none: { userId: 'user-a' } } }
    }));
  });

  it('creates the workspace and OWNER membership in one transaction', async () => {
    const createdAt = new Date('2026-07-19T00:00:00.000Z');
    const workspace = {
      id: '00000000-0000-4000-8000-000000000020',
      name: 'Booking',
      description: 'Operations planning',
      tone: null,
      private: true,
      publicAccess: 'VIEW',
      timezone: 'UTC',
      locale: 'en',
      createdBy: { id: '00000000-0000-4000-8000-000000000001', displayName: 'Owner', avatarUrl: null },
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
      description: 'Operations planning',
      private: true,
      publicAccess: 'VIEW',
      timezone: 'UTC',
      locale: 'en'
    })).resolves.toEqual({ ...workspace, role: 'OWNER' });
    const workspaceInput = transaction.workspace.create.mock.calls[0]?.[0] as unknown as { data: { createdById: string; name: string; description: string | null; publicAccess: string } };
    const membershipInput = transaction.workspaceMember.create.mock.calls[0]?.[0] as unknown as { data: { workspaceId: string; userId: string; role: string } };
    expect(workspaceInput.data).toMatchObject({ createdById: '00000000-0000-4000-8000-000000000001', name: 'Booking', description: 'Operations planning', publicAccess: 'VIEW' });
    expect(membershipInput.data).toMatchObject({ workspaceId: workspace.id, role: 'OWNER' });
  });

  it('allows only an OWNER to update Space settings', async () => {
    const updated = { id: 'workspace-1', name: 'Design', description: 'Design system', tone: 'appearance:target|bg-emerald-500', private: false, publicAccess: 'EDIT', createdBy: { id: 'owner-1', displayName: 'Owner', avatarUrl: null } };
    const prisma = {
      workspaceMember: { findUnique: vi.fn().mockResolvedValue({ role: 'OWNER' }) },
      workspace: { update: vi.fn().mockResolvedValue(updated) }
    };
    const service = new WorkspaceService(prisma as unknown as PrismaService);

    await expect(service.update('workspace-1', 'owner-1', { name: 'Design', description: 'Design system', private: false, publicAccess: 'EDIT', tone: 'appearance:target|bg-emerald-500' })).resolves.toMatchObject({ ...updated, role: 'OWNER' });
    expect(prisma.workspace.update).toHaveBeenCalledWith(expect.objectContaining({ data: { name: 'Design', description: 'Design system', private: false, publicAccess: 'EDIT', tone: 'appearance:target|bg-emerald-500' } }));

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

