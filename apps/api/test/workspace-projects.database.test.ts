import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/database/prisma.service';
import { StructuredLoggerService } from '../src/observability/structured-logger.service';
import { registerVerifiedUser } from './auth-test-helper';

const enabled = process.env.DATABASE_INTEGRATION_TESTS === '1' && Boolean(process.env.DATABASE_URL);
const describeDatabase = enabled ? describe : describe.skip;
const emails = ['task5-owner-a@clickflow.test', 'task5-owner-b@clickflow.test'];

describeDatabase('workspace, project, status and section HTTP lifecycle', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  async function cleanup(): Promise<void> {
    const users = await prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true } });
    const userIds = users.map(({ id }) => id);
    if (userIds.length > 0) {
      await prisma.workspace.deleteMany({ where: { createdById: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
  }

  async function register(email: string, displayName: string): Promise<{ accessToken: string; userId: string; workspaceId: string }> {
    const registered = await registerVerifiedUser(app, prisma, {
      email,
      displayName,
      password: 'Task-Five-Pass-9!'
    });
    const workspaces = await request(app.getHttpServer()).get('/api/v1/workspaces')
      .set('Authorization', `Bearer ${registered.accessToken}`)
      .expect(200);
    expect(workspaces.body).toHaveLength(1);
    expect(workspaces.body[0]).toMatchObject({ role: 'OWNER' });
    return {
      accessToken: registered.accessToken,
      userId: registered.userId,
      workspaceId: String(workspaces.body[0].id)
    };
  }

  beforeAll(async () => {
    const silentLogger = { log: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn(), verbose: vi.fn(), fatal: vi.fn() };
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(StructuredLoggerService)
      .useValue(silentLogger)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app, { corsOrigins: ['http://localhost:3000'] });
    await app.init();
    prisma = app.get(PrismaService);
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  it('enforces workspace/project isolation and all Task 5 invariants', async () => {
    const ownerA = await register(emails[0]!, 'Task Five A');
    const ownerB = await register(emails[1]!, 'Task Five B');
    const authA = { Authorization: `Bearer ${ownerA.accessToken}` };
    const authB = { Authorization: `Bearer ${ownerB.accessToken}` };

    await request(app.getHttpServer()).get(`/api/v1/workspaces/${ownerA.workspaceId}/members`)
      .set(authA)
      .expect(200)
      .expect(({ body }) => expect(body[0]).toMatchObject({ userId: ownerA.userId, role: 'OWNER', initials: 'TF' }));
    await request(app.getHttpServer()).get(`/api/v1/workspaces/${ownerA.workspaceId}/members`)
      .set(authB)
      .expect(403);

    const futureDeadline = new Date(Date.now() + 7 * 86_400_000).toISOString();
    const createdProject = await request(app.getHttpServer()).post(`/api/v1/workspaces/${ownerA.workspaceId}/projects`)
      .set(authA)
      .send({ name: 'Launch Project', deadline: futureDeadline })
      .expect(201);
    const projectId = String(createdProject.body.id);

    await request(app.getHttpServer()).get(`/api/v1/workspaces/${ownerA.workspaceId}/projects/${projectId}`)
      .set(authB)
      .expect(403);
    await request(app.getHttpServer()).patch(`/api/v1/workspaces/${ownerA.workspaceId}/projects/${projectId}`)
      .set(authA)
      .send({ description: 'Updated through the API' })
      .expect(200)
      .expect(({ body }) => expect(body.description).toBe('Updated through the API'));

    const todo = await request(app.getHttpServer()).post(`/api/v1/workspaces/${ownerA.workspaceId}/projects/${projectId}/statuses`)
      .set(authA)
      .send({ name: 'To do', color: '#64748b', category: 'OPEN' })
      .expect(201);
    const done = await request(app.getHttpServer()).post(`/api/v1/workspaces/${ownerA.workspaceId}/projects/${projectId}/statuses`)
      .set(authA)
      .send({ name: 'Done', color: '#22c55e', category: 'COMPLETED' })
      .expect(201);
    expect(done.body.completed).toBe(true);
    const todoStatusId = String(todo.body.id);
    const doneStatusId = String(done.body.id);

    const backlog = await request(app.getHttpServer()).post(`/api/v1/workspaces/${ownerA.workspaceId}/projects/${projectId}/sections`)
      .set(authA)
      .send({ name: 'Backlog' })
      .expect(201);
    const active = await request(app.getHttpServer()).post(`/api/v1/workspaces/${ownerA.workspaceId}/projects/${projectId}/sections`)
      .set(authA)
      .send({ name: 'Active' })
      .expect(201);

    await request(app.getHttpServer()).post(`/api/v1/workspaces/${ownerA.workspaceId}/projects/${projectId}/statuses/reorder`)
      .set(authA)
      .send({ orderedIds: [doneStatusId, todoStatusId] })
      .expect(200)
      .expect(({ body }) => {
        const responseBody: unknown = body;
        const ids = Array.isArray(responseBody)
          ? responseBody.map((status: unknown) => status && typeof status === 'object' && 'id' in status ? String(status.id) : '')
          : [];
        expect(ids).toEqual([doneStatusId, todoStatusId]);
      });
    await request(app.getHttpServer()).post(`/api/v1/workspaces/${ownerA.workspaceId}/projects/${projectId}/sections/reorder`)
      .set(authA)
      .send({ orderedIds: [String(active.body.id), String(backlog.body.id)] })
      .expect(200);

    const secondProject = await request(app.getHttpServer()).post(`/api/v1/workspaces/${ownerA.workspaceId}/projects`)
      .set(authA)
      .send({ name: 'Second Project' })
      .expect(201);
    const foreignStatus = await request(app.getHttpServer()).post(`/api/v1/workspaces/${ownerA.workspaceId}/projects/${String(secondProject.body.id)}/statuses`)
      .set(authA)
      .send({ name: 'Foreign', color: '#ef4444', category: 'IN_PROGRESS' })
      .expect(201);

    await request(app.getHttpServer()).patch(`/api/v1/workspaces/${ownerA.workspaceId}/projects/${String(secondProject.body.id)}/sections/${String(backlog.body.id)}`)
      .set(authA)
      .send({ name: 'Cross-project change' })
      .expect(404);

    const task = await prisma.task.create({
      data: {
        workspaceId: ownerA.workspaceId,
        projectId,
        sectionId: String(backlog.body.id),
        statusId: todoStatusId,
        title: 'Overdue task',
        dueAt: new Date(Date.now() - 86_400_000)
      }
    });
    await request(app.getHttpServer()).get(`/api/v1/workspaces/${ownerA.workspaceId}/projects/${projectId}`)
      .set(authA)
      .expect(200)
      .expect(({ body }) => expect(body.health).toMatchObject({ totalTasks: 1, overdueTasks: 1, progressPercent: 0, health: 'AT_RISK' }));

    await request(app.getHttpServer()).delete(`/api/v1/workspaces/${ownerA.workspaceId}/projects/${projectId}/statuses/${todoStatusId}`)
      .set(authA)
      .send({})
      .expect(409);
    await request(app.getHttpServer()).delete(`/api/v1/workspaces/${ownerA.workspaceId}/projects/${projectId}/statuses/${todoStatusId}`)
      .set(authA)
      .send({ replacementStatusId: String(foreignStatus.body.id) })
      .expect(409);
    await request(app.getHttpServer()).delete(`/api/v1/workspaces/${ownerA.workspaceId}/projects/${projectId}/statuses/${todoStatusId}`)
      .set(authA)
      .send({ replacementStatusId: doneStatusId })
      .expect(204);
    await expect(prisma.task.findUniqueOrThrow({ where: { id: task.id }, select: { statusId: true } }))
      .resolves.toEqual({ statusId: doneStatusId });

    await request(app.getHttpServer()).get(`/api/v1/workspaces/${ownerA.workspaceId}/projects?search=Launch&page=1&pageSize=10&sortBy=name&sortOrder=asc`)
      .set(authA)
      .expect(200)
      .expect(({ body }) => expect(body).toMatchObject({ page: 1, pageSize: 10, total: 1 }));
    await request(app.getHttpServer()).delete(`/api/v1/workspaces/${ownerA.workspaceId}/projects/${projectId}`)
      .set(authA)
      .expect(204);
    await request(app.getHttpServer()).get(`/api/v1/workspaces/${ownerA.workspaceId}/projects?archived=archived`)
      .set(authA)
      .expect(200)
      .expect(({ body }) => {
        const responseBody: unknown = body;
        const items = responseBody && typeof responseBody === 'object' && 'items' in responseBody && Array.isArray(responseBody.items)
          ? responseBody.items
          : [];
        const ids = items.map((project: unknown) => project && typeof project === 'object' && 'id' in project ? String(project.id) : '');
        expect(ids).toContain(projectId);
      });

    const activityCount = await prisma.activityLog.count({ where: { workspaceId: ownerA.workspaceId } });
    expect(activityCount).toBeGreaterThanOrEqual(10);
  });
});
