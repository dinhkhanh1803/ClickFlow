import { PrismaClient, StatusScopeType } from '@prisma/client';

import { PrismaService } from '../src/database/prisma.service';
import { WorkspaceTaskRepository } from '../src/database/workspace-task.repository';

const enabled = process.env.DATABASE_INTEGRATION_TESTS === '1' && Boolean(process.env.DATABASE_URL);
const describeDatabase = enabled ? describe : describe.skip;

describeDatabase('workspace database foundation', () => {
  const prisma = new PrismaClient();
  const repository = new WorkspaceTaskRepository(prisma as PrismaService);
  const suffix = '000000000001';
  const ids = {
    user: `10000000-0000-4000-8000-${suffix}`,
    workspaceA: `20000000-0000-4000-8000-${suffix}`,
    workspaceB: `30000000-0000-4000-8000-${suffix}`,
    projectA: `40000000-0000-4000-8000-${suffix}`,
    sectionA: `50000000-0000-4000-8000-${suffix}`,
    statusA: `60000000-0000-4000-8000-${suffix}`,
    taskA: `70000000-0000-4000-8000-${suffix}`,
    tagA: `80000000-0000-4000-8000-${suffix}`,
    rollbackTag: `90000000-0000-4000-8000-${suffix}`
  } as const;

  beforeAll(async () => {
    await prisma.user.create({ data: { id: ids.user, email: 'workspace-isolation@clickflow.test', displayName: 'Isolation Test' } });
    await prisma.workspace.createMany({
      data: [
        { id: ids.workspaceA, createdById: ids.user, name: 'Workspace A' },
        { id: ids.workspaceB, createdById: ids.user, name: 'Workspace B' }
      ]
    });
    await prisma.project.create({ data: { id: ids.projectA, workspaceId: ids.workspaceA, name: 'Project A' } });
    await prisma.section.create({ data: { id: ids.sectionA, workspaceId: ids.workspaceA, projectId: ids.projectA, name: 'Section A' } });
    await prisma.taskStatus.create({
      data: {
        id: ids.statusA,
        workspaceId: ids.workspaceA,
        projectId: ids.projectA,
        sectionId: ids.sectionA,
        scopeType: StatusScopeType.SECTION,
        scopeId: ids.sectionA,
        name: 'To do',
        color: '#64748b'
      }
    });
    await prisma.task.create({
      data: {
        id: ids.taskA,
        workspaceId: ids.workspaceA,
        projectId: ids.projectA,
        sectionId: ids.sectionA,
        statusId: ids.statusA,
        title: 'Workspace A task'
      }
    });
  });

  afterAll(async () => {
    await prisma.workspace.deleteMany({ where: { id: { in: [ids.workspaceA, ids.workspaceB] } } });
    await prisma.user.deleteMany({ where: { id: ids.user } });
    await prisma.$disconnect();
  });

  it('enforces workspace tag uniqueness', async () => {
    await prisma.tag.create({ data: { id: ids.tagA, workspaceId: ids.workspaceA, name: 'backend', color: '#2563eb' } });
    await expect(prisma.tag.create({
      data: { workspaceId: ids.workspaceA, name: 'backend', color: '#0f172a' }
    })).rejects.toMatchObject({ code: 'P2002' });
  });

  it('rolls back all writes when a transaction fails', async () => {
    await expect(prisma.$transaction(async (transaction) => {
      await transaction.tag.create({
        data: { id: ids.rollbackTag, workspaceId: ids.workspaceA, name: 'rollback', color: '#dc2626' }
      });
      throw new Error('force rollback');
    })).rejects.toThrow('force rollback');
    await expect(prisma.tag.findUnique({ where: { id: ids.rollbackTag } })).resolves.toBeNull();
  });

  it('cannot read a task through another workspace scope', async () => {
    await expect(repository.findById(ids.workspaceB, ids.taskA)).resolves.toBeNull();
    await expect(repository.findById(ids.workspaceA, ids.taskA)).resolves.toMatchObject({ id: ids.taskA });
  });

  it('cannot update a task through another workspace scope', async () => {
    await expect(repository.rename(ids.workspaceB, ids.taskA, 'Cross-workspace update')).resolves.toBeNull();
    await expect(repository.findById(ids.workspaceA, ids.taskA)).resolves.toMatchObject({ title: 'Workspace A task' });
  });
});
