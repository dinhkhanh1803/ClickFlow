import { PrismaClient } from '@prisma/client';

const enabled = process.env.DATABASE_INTEGRATION_TESTS === '1' && Boolean(process.env.DATABASE_URL);
const describeDatabase = enabled ? describe : describe.skip;

describeDatabase('database foundation', () => {
  const prisma = new PrismaClient();
  const suffix = '000000000001';
  const ids = {
    user: `10000000-0000-4000-8000-${suffix}`,
    workspace: `20000000-0000-4000-8000-${suffix}`,
    tag: `80000000-0000-4000-8000-${suffix}`,
    rollbackTag: `90000000-0000-4000-8000-${suffix}`
  } as const;

  beforeAll(async () => {
    await prisma.user.create({
      data: { id: ids.user, email: 'database-foundation@clickflow.test', displayName: 'Database Test' }
    });
    await prisma.workspace.create({
      data: { id: ids.workspace, createdById: ids.user, name: 'Database Foundation' }
    });
  });

  afterAll(async () => {
    await prisma.workspace.deleteMany({ where: { id: ids.workspace } });
    await prisma.user.deleteMany({ where: { id: ids.user } });
    await prisma.$disconnect();
  });

  it('enforces workspace tag uniqueness', async () => {
    await prisma.tag.create({
      data: { id: ids.tag, workspaceId: ids.workspace, name: 'backend', color: '#2563eb' }
    });
    await expect(prisma.tag.create({
      data: { workspaceId: ids.workspace, name: 'backend', color: '#0f172a' }
    })).rejects.toMatchObject({ code: 'P2002' });
  });

  it('rolls back every write when a transaction fails', async () => {
    await expect(prisma.$transaction(async (transaction) => {
      await transaction.tag.create({
        data: { id: ids.rollbackTag, workspaceId: ids.workspace, name: 'rollback', color: '#dc2626' }
      });
      throw new Error('force rollback');
    })).rejects.toThrow('force rollback');
    await expect(prisma.tag.findUnique({ where: { id: ids.rollbackTag } })).resolves.toBeNull();
  });
});
