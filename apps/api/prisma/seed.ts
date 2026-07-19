import { PrismaClient, StatusCategory, StatusScopeType, TaskPriority, WorkspaceRole } from '@prisma/client';

const prisma = new PrismaClient();

const ids = {
  user: '00000000-0000-4000-8000-000000000001',
  workspace: '00000000-0000-4000-8000-000000000010',
  member: '00000000-0000-4000-8000-000000000011',
  project: '00000000-0000-4000-8000-000000000020',
  section: '00000000-0000-4000-8000-000000000030',
  statusOpen: '00000000-0000-4000-8000-000000000040',
  statusInProgress: '00000000-0000-4000-8000-000000000041',
  statusComplete: '00000000-0000-4000-8000-000000000042',
  document: '00000000-0000-4000-8000-000000000050',
  task: '00000000-0000-4000-8000-000000000060'
} as const;

async function main(): Promise<void> {
  const passwordHash = process.env.SEED_USER_PASSWORD_HASH;
  if (!passwordHash) throw new Error('SEED_USER_PASSWORD_HASH is required to run the development seed');

  await prisma.$transaction(async (transaction) => {
    await transaction.user.upsert({
      where: { id: ids.user },
      update: { displayName: 'ClickFlow Demo', passwordHash, emailVerifiedAt: new Date() },
      create: {
        id: ids.user,
        email: process.env.SEED_USER_EMAIL ?? 'demo@clickflow.local',
        displayName: 'ClickFlow Demo',
        passwordHash,
        timezone: 'UTC',
        locale: 'en'
      }
    });
    await transaction.workspace.upsert({
      where: { id: ids.workspace },
      update: { name: 'Demo Workspace' },
      create: { id: ids.workspace, createdById: ids.user, name: 'Demo Workspace', private: true }
    });
    await transaction.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: ids.workspace, userId: ids.user } },
      update: { role: WorkspaceRole.OWNER },
      create: { id: ids.member, workspaceId: ids.workspace, userId: ids.user, role: WorkspaceRole.OWNER }
    });
    await transaction.project.upsert({
      where: { id: ids.project },
      update: { name: 'Demo Project' },
      create: { id: ids.project, workspaceId: ids.workspace, name: 'Demo Project', position: 0 }
    });
    await transaction.section.upsert({
      where: { id: ids.section },
      update: { name: 'Backlog' },
      create: { id: ids.section, workspaceId: ids.workspace, projectId: ids.project, name: 'Backlog', position: 0 }
    });
    await transaction.taskStatus.upsert({
      where: { id: ids.statusOpen },
      update: { name: 'Open', color: '#64748b', isSystem: true },
      create: {
        id: ids.statusOpen,
        workspaceId: ids.workspace,
        projectId: ids.project,
        sectionId: ids.section,
        scopeType: StatusScopeType.SECTION,
        scopeId: ids.section,
        name: 'Open',
        color: '#64748b',
        category: StatusCategory.NOT_STARTED,
        isSystem: true,
        position: 0
      }
    });
    await transaction.taskStatus.upsert({
      where: { id: ids.statusInProgress },
      update: { name: 'In progress', color: '#3b82f6', isSystem: true },
      create: {
        id: ids.statusInProgress,
        workspaceId: ids.workspace,
        projectId: ids.project,
        sectionId: ids.section,
        scopeType: StatusScopeType.SECTION,
        scopeId: ids.section,
        name: 'In progress',
        color: '#3b82f6',
        category: StatusCategory.IN_PROGRESS,
        isSystem: true,
        position: 1
      }
    });
    await transaction.taskStatus.upsert({
      where: { id: ids.statusComplete },
      update: { name: 'Complete', color: '#10b981', completed: true, isSystem: true },
      create: {
        id: ids.statusComplete,
        workspaceId: ids.workspace,
        projectId: ids.project,
        sectionId: ids.section,
        scopeType: StatusScopeType.SECTION,
        scopeId: ids.section,
        name: 'Complete',
        color: '#10b981',
        category: StatusCategory.COMPLETED,
        completed: true,
        isSystem: true,
        position: 2
      }
    });
    await transaction.document.upsert({
      where: { id: ids.document },
      update: { title: 'Project brief' },
      create: {
        id: ids.document,
        workspaceId: ids.workspace,
        projectId: ids.project,
        sectionId: ids.section,
        title: 'Project brief',
        content: 'Deterministic document created by the development seed.'
      }
    });
    await transaction.task.upsert({
      where: { id: ids.task },
      update: { title: 'Review the ClickFlow demo task' },
      create: {
        id: ids.task,
        workspaceId: ids.workspace,
        projectId: ids.project,
        sectionId: ids.section,
        statusId: ids.statusOpen,
        assigneeId: ids.user,
        title: 'Review the ClickFlow demo task',
        priority: TaskPriority.NORMAL,
        position: 0
      }
    });
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
