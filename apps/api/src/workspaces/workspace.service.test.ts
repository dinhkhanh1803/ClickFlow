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
});
