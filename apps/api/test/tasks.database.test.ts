import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/database/prisma.service';
import { StructuredLoggerService } from '../src/observability/structured-logger.service';

const enabled = process.env.DATABASE_INTEGRATION_TESTS === '1' && Boolean(process.env.DATABASE_URL);
const describeDatabase = enabled ? describe : describe.skip;
const emails = ['task6-owner-a@clickflow.test', 'task6-owner-b@clickflow.test'];

function responseBody<T>(response: { body: unknown }): T {
  return response.body as T;
}

describeDatabase('Task 6 HTTP lifecycle', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  async function cleanup(): Promise<void> {
    const users = await prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true } });
    const userIds = users.map(({ id }) => id);
    if (userIds.length) {
      await prisma.workspace.deleteMany({ where: { createdById: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
  }

  async function register(email: string) {
    const response = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      email,
      displayName: 'Task Six Owner',
      password: 'Task-Six-Pass-9!'
    }).expect(201);
    const accessToken = String(response.body.accessToken);
    const workspaces = await request(app.getHttpServer()).get('/api/v1/workspaces').set('Authorization', `Bearer ${accessToken}`).expect(200);
    return { accessToken, userId: String(response.body.user.id), workspaceId: String(workspaces.body[0].id) };
  }

  beforeAll(async () => {
    const silentLogger = { log: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn(), verbose: vi.fn(), fatal: vi.fn() };
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(StructuredLoggerService).useValue(silentLogger).compile();
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

  it('enforces isolation, task rules, ordering, accessories, versioning and audit', async () => {
    const ownerA = await register(emails[0]!);
    const ownerB = await register(emails[1]!);
    const authA = { Authorization: `Bearer ${ownerA.accessToken}` };
    const authB = { Authorization: `Bearer ${ownerB.accessToken}` };
    const base = `/api/v1/workspaces/${ownerA.workspaceId}`;

    const project = await request(app.getHttpServer()).post(`${base}/projects`).set(authA).send({ name: 'Task Core' }).expect(201);
    const otherProject = await request(app.getHttpServer()).post(`${base}/projects`).set(authA).send({ name: 'Foreign Project' }).expect(201);
    const projectId = responseBody<{ id: string }>(project).id;
    const otherProjectId = responseBody<{ id: string }>(otherProject).id;
    const todo = await request(app.getHttpServer()).post(`${base}/projects/${projectId}/statuses`).set(authA).send({ name: 'Todo', color: '#64748b', category: 'OPEN' }).expect(201);
    const done = await request(app.getHttpServer()).post(`${base}/projects/${projectId}/statuses`).set(authA).send({ name: 'Done', color: '#22c55e', category: 'COMPLETED' }).expect(201);
    const foreignStatus = await request(app.getHttpServer()).post(`${base}/projects/${otherProjectId}/statuses`).set(authA).send({ name: 'Foreign', color: '#f00', category: 'OPEN' }).expect(201);
    const section = await request(app.getHttpServer()).post(`${base}/projects/${projectId}/sections`).set(authA).send({ name: 'Sprint' }).expect(201);
    const todoId = responseBody<{ id: string }>(todo).id;
    const doneId = responseBody<{ id: string }>(done).id;
    const foreignStatusId = responseBody<{ id: string }>(foreignStatus).id;
    const sectionId = responseBody<{ id: string }>(section).id;

    const created = await request(app.getHttpServer()).post(`${base}/tasks`).set(authA).send({
      projectId,
      sectionId,
      statusId: todoId,
      assigneeId: ownerA.userId,
      title: 'Implement Task 6',
      priority: 'URGENT',
      dueAt: new Date(Date.now() + 86_400_000).toISOString()
    }).expect(201);
    const createdBody = responseBody<{ id: string; projectId: string; statusId: string; version: number; completedAt: string | null; priority: string; assignee: { id: string; initials: string } }>(created);
    const taskId = createdBody.id;
    expect(createdBody).toMatchObject({ projectId, statusId: todoId, version: 1, completedAt: null, priority: 'URGENT' });
    expect(createdBody.assignee).toMatchObject({ id: ownerA.userId, initials: 'TS' });

    await request(app.getHttpServer()).get(`${base}/tasks/${taskId}`).set(authB).expect(403);
    await request(app.getHttpServer()).post(`${base}/tasks`).set(authA).send({ projectId, statusId: foreignStatusId, title: 'Wrong status' }).expect(409);
    await request(app.getHttpServer()).patch(`${base}/tasks/${taskId}`).set(authA).send({ version: 1, parentTaskId: taskId }).expect(409);

    const completed = await request(app.getHttpServer()).post(`${base}/tasks/${taskId}/complete`).set(authA).send({ version: 1, statusId: doneId }).expect(200);
    expect(responseBody<{ completedAt: string | null }>(completed).completedAt).toBeTruthy();
    const reopened = await request(app.getHttpServer()).patch(`${base}/tasks/${taskId}`).set(authA).send({ version: 2, statusId: todoId }).expect(200);
    expect(responseBody<{ version: number; completedAt: string | null }>(reopened)).toMatchObject({ version: 3, completedAt: null });
    await request(app.getHttpServer()).patch(`${base}/tasks/${taskId}`).set(authA).send({ version: 2, title: 'Lost update' }).expect(409);

    const second = await request(app.getHttpServer()).post(`${base}/tasks`).set(authA).send({ projectId, statusId: todoId, title: 'Second task' }).expect(201);
    const secondId = responseBody<{ id: string }>(second).id;
    const [moveA, moveB] = await Promise.all([
      request(app.getHttpServer()).post(`${base}/tasks/${taskId}/move`).set(authA).send({ version: 3, statusId: todoId, beforeTaskId: secondId }),
      request(app.getHttpServer()).post(`${base}/tasks/${taskId}/move`).set(authA).send({ version: 3, statusId: todoId, afterTaskId: secondId })
    ]);
    expect([moveA.status, moveB.status].sort()).toEqual([200, 409]);
    const ordered = await prisma.task.findMany({ where: { workspaceId: ownerA.workspaceId, projectId, statusId: todoId, archivedAt: null }, orderBy: { position: 'asc' }, select: { id: true, position: true } });
    expect(new Set(ordered.map(({ position }) => position.toString())).size).toBe(ordered.length);

    const child = await request(app.getHttpServer()).post(`${base}/tasks`).set(authA).send({ projectId, statusId: todoId, parentTaskId: taskId, title: 'Valid child' }).expect(201);
    const childId = responseBody<{ id: string }>(child).id;
    await request(app.getHttpServer()).patch(`${base}/tasks/${taskId}`).set(authA).send({ version: 4, parentTaskId: childId }).expect(409);

    const checklist = await request(app.getHttpServer()).post(`${base}/tasks/${taskId}/checklist-items`).set(authA).send({ label: 'Write tests' }).expect(201);
    const checklistId = responseBody<{ id: string }>(checklist).id;
    const toggled = await request(app.getHttpServer()).patch(`${base}/tasks/${taskId}/checklist-items/${checklistId}`).set(authA).send({ completed: true }).expect(200);
    expect(responseBody<{ completed: boolean }>(toggled).completed).toBe(true);
    const tag = await request(app.getHttpServer()).post(`${base}/tags`).set(authA).send({ name: 'backend', color: '#2563eb' }).expect(201);
    const tagId = responseBody<{ id: string }>(tag).id;
    await request(app.getHttpServer()).post(`${base}/tasks/${taskId}/tags`).set(authA).send({ tagId }).expect(204);
    await request(app.getHttpServer()).post(`${base}/tasks/${taskId}/tags`).set(authA).send({ tagId }).expect(204);
    await request(app.getHttpServer()).delete(`${base}/tasks/${taskId}/tags/${tagId}`).set(authA).expect(204);

    const current = await request(app.getHttpServer()).get(`${base}/tasks/${taskId}`).set(authA).expect(200);
    await request(app.getHttpServer()).delete(`${base}/tasks/${taskId}?version=${responseBody<{ version: number }>(current).version}`).set(authA).expect(204);
    const activeList = await request(app.getHttpServer()).get(`${base}/tasks?projectId=${projectId}`).set(authA).expect(200);
    expect(responseBody<{ items: Array<{ id: string }> }>(activeList).items.some((item) => item.id === taskId)).toBe(false);
    const archived = await request(app.getHttpServer()).get(`${base}/tasks/${taskId}`).set(authA).expect(200);
    const restored = await request(app.getHttpServer()).post(`${base}/tasks/${taskId}/restore`).set(authA).send({ version: responseBody<{ version: number }>(archived).version }).expect(200);
    expect(responseBody<{ archivedAt: string | null }>(restored).archivedAt).toBeNull();

    const activity = await prisma.activityLog.findMany({ where: { workspaceId: ownerA.workspaceId, subjectType: 'TASK', subjectId: taskId }, select: { eventType: true } });
    expect(activity.map(({ eventType }) => eventType)).toEqual(expect.arrayContaining(['TASK_CREATED', 'TASK_COMPLETED', 'TASK_UPDATED', 'TASK_MOVED', 'TASK_ARCHIVED', 'TASK_RESTORED', 'CHECKLIST_ITEM_CREATED', 'TASK_TAG_ATTACHED']));
  });
});
