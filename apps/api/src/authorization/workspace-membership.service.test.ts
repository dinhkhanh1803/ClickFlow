import type { PrismaService } from '../database/prisma.service';
import { WorkspaceMembershipService } from './workspace-membership.service';

describe('WorkspaceMembershipService', () => {
  it('checks both user and workspace while excluding archived workspaces', async () => {
    const prisma = { workspaceMember: { findFirst: vi.fn().mockResolvedValue({ id: 'membership-a' }) } };
    const service = new WorkspaceMembershipService(prisma as unknown as PrismaService);

    await expect(service.hasAccess('user-a', 'workspace-a')).resolves.toBe(true);
    expect(prisma.workspaceMember.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-a', workspaceId: 'workspace-a', workspace: { archivedAt: null } },
      select: { id: true }
    });
  });
});
