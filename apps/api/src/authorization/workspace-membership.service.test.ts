import type { PrismaService } from '../database/prisma.service';
import { WorkspaceMembershipService } from './workspace-membership.service';

describe('WorkspaceMembershipService', () => {
  it('checks both user and workspace while excluding archived workspaces', async () => {
    const prisma = { workspaceMember: { findFirst: vi.fn().mockResolvedValue({ id: 'membership-a' }) }, workspace: { findFirst: vi.fn() } };
    const service = new WorkspaceMembershipService(prisma as unknown as PrismaService);

    await expect(service.hasAccess('user-a', 'workspace-a')).resolves.toBe(true);
    expect(prisma.workspaceMember.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-a', workspaceId: 'workspace-a', workspace: { archivedAt: null } },
      select: { id: true }
    });
  });

  it('allows public view and public edit based on Workspace public access', async () => {
    const prisma = {
      workspaceMember: { findFirst: vi.fn().mockResolvedValue(null) },
      workspace: { findFirst: vi.fn()
        .mockResolvedValueOnce({ id: 'workspace-a' })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'workspace-a' }) }
    };
    const service = new WorkspaceMembershipService(prisma as unknown as PrismaService);

    await expect(service.hasAccess('user-b', 'workspace-a', 'VIEW')).resolves.toBe(true);
    await expect(service.hasAccess('user-b', 'workspace-a', 'EDIT')).resolves.toBe(false);
    await expect(service.hasAccess('user-b', 'workspace-a', 'EDIT')).resolves.toBe(true);
    expect(prisma.workspace.findFirst).toHaveBeenNthCalledWith(1, {
      where: { id: 'workspace-a', archivedAt: null, private: false, publicAccess: { in: ['VIEW', 'EDIT'] } },
      select: { id: true }
    });
    expect(prisma.workspace.findFirst).toHaveBeenNthCalledWith(2, {
      where: { id: 'workspace-a', archivedAt: null, private: false, publicAccess: 'EDIT' },
      select: { id: true }
    });
  });
});
