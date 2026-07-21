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
const emails = ['task7-owner@clickflow.test', 'task7-member@clickflow.test'];

function responseBody<T>(response: { body: unknown }): T {
  return response.body as T;
}

describeDatabase('Task 7 comments and activity HTTP lifecycle', () => {
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

  async function register(email: string, displayName: string) {
    const registered = await registerVerifiedUser(app, prisma, {
      email,
      displayName,
      password: 'Task-Seven-Pass-9!'
    });
    return { accessToken: registered.accessToken, userId: registered.userId, workspaceId: registered.workspaceId };
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

  it('enforces comment policy, stable cursors, archived reads, isolation and immutable activity', async () => {
    const owner = await register(emails[0]!, 'Owner Seven');
    const member = await register(emails[1]!, 'Member Seven');
    await prisma.workspaceMember.create({ data: { workspaceId: owner.workspaceId, userId: member.userId, role: 'MEMBER' } });
    const authOwner = { Authorization: `Bearer ${owner.accessToken}` };
    const authMember = { Authorization: `Bearer ${member.accessToken}` };
    const ownerBase = `/api/v1/workspaces/${owner.workspaceId}`;

    const project = await request(app.getHttpServer()).post(`${ownerBase}/projects`).set(authOwner).send({ name: 'Comment Project' }).expect(201);
    const projectId = responseBody<{ id: string }>(project).id;
    const status = await request(app.getHttpServer()).post(`${ownerBase}/projects/${projectId}/statuses`).set(authOwner).send({ name: 'Open', color: '#64748b', category: 'OPEN' }).expect(201);
    const statusId = responseBody<{ id: string }>(status).id;
    const task = await request(app.getHttpServer()).post(`${ownerBase}/tasks`).set(authOwner).send({ projectId, statusId, title: 'Discuss API' }).expect(201);
    const taskId = responseBody<{ id: string }>(task).id;
    const commentsUrl = `${ownerBase}/tasks/${taskId}/comments`;

    const ownerComment = await request(app.getHttpServer()).post(commentsUrl).set(authOwner).send({ body: 'Owner comment' }).expect(201);
    const ownerCommentId = responseBody<{ id: string }>(ownerComment).id;
    const memberComment = await request(app.getHttpServer()).post(commentsUrl).set(authMember).send({ body: 'Member comment' }).expect(201);
    const memberCommentId = responseBody<{ id: string }>(memberComment).id;

    const firstPage = await request(app.getHttpServer()).get(`${commentsUrl}?limit=1`).set(authOwner).expect(200);
    const firstBody = responseBody<{ items: Array<{ id: string }>; nextCursor: string | null }>(firstPage);
    expect(firstBody.items).toHaveLength(1);
    expect(firstBody.nextCursor).toBe(firstBody.items[0]!.id);
    const secondPage = await request(app.getHttpServer()).get(`${commentsUrl}?limit=1&cursor=${firstBody.nextCursor}`).set(authOwner).expect(200);
    expect(responseBody<{ items: Array<{ id: string }> }>(secondPage).items[0]!.id).not.toBe(firstBody.items[0]!.id);

    await request(app.getHttpServer()).patch(`${commentsUrl}/${memberCommentId}`).set(authOwner).send({ body: 'Owner cannot rewrite this' }).expect(403);
    await request(app.getHttpServer()).delete(`${commentsUrl}/${ownerCommentId}`).set(authMember).expect(403);
    await request(app.getHttpServer()).patch(`${commentsUrl}/${memberCommentId}`).set(authMember).send({ body: 'Member edited' }).expect(200);
    await request(app.getHttpServer()).delete(`${commentsUrl}/${memberCommentId}`).set(authOwner).expect(204);
    const remaining = await request(app.getHttpServer()).get(commentsUrl).set(authOwner).expect(200);
    expect(responseBody<{ items: Array<{ id: string }> }>(remaining).items.map(({ id }) => id)).toEqual([ownerCommentId]);
    await request(app.getHttpServer()).get(`${commentsUrl}?cursor=${memberCommentId}`).set(authOwner).expect(400);

    await request(app.getHttpServer()).get(`${ownerBase}/tasks/${taskId}`).set({ Authorization: `Bearer ${member.accessToken}` }).expect(200);
    await request(app.getHttpServer()).get(`/api/v1/workspaces/${member.workspaceId}/tasks/${taskId}/comments`).set(authOwner).expect(403);

    const activityUrl = `${ownerBase}/tasks/${taskId}/activity`;
    const activityPage = await request(app.getHttpServer()).get(`${activityUrl}?limit=2`).set(authOwner).expect(200);
    const activityBody = responseBody<{ items: Array<{ id: string; eventType: string }>; nextCursor: string | null }>(activityPage);
    expect(activityBody.items).toHaveLength(2);
    expect(activityBody.nextCursor).toBeTruthy();
    expect(activityBody.items.map(({ eventType }) => eventType)).toEqual(expect.arrayContaining(['COMMENT_DELETED', 'COMMENT_UPDATED']));
    await request(app.getHttpServer()).get(`${activityUrl}?limit=2&cursor=${activityBody.nextCursor}`).set(authOwner).expect(200);

    const beforeImmutableChecks = await prisma.activityLog.count({ where: { workspaceId: owner.workspaceId, subjectType: 'TASK', subjectId: taskId } });
    await request(app.getHttpServer()).post(activityUrl).set(authOwner).send({ eventType: 'FORGED' }).expect(404);
    await request(app.getHttpServer()).patch(`${activityUrl}/${activityBody.items[0]!.id}`).set(authOwner).send({ eventType: 'FORGED' }).expect(404);
    await request(app.getHttpServer()).delete(`${activityUrl}/${activityBody.items[0]!.id}`).set(authOwner).expect(404);
    expect(await prisma.activityLog.count({ where: { workspaceId: owner.workspaceId, subjectType: 'TASK', subjectId: taskId } })).toBe(beforeImmutableChecks);

    await request(app.getHttpServer()).delete(`${ownerBase}/tasks/${taskId}?version=1`).set(authOwner).expect(204);
    await request(app.getHttpServer()).get(commentsUrl).set(authOwner).expect(200);
    await request(app.getHttpServer()).get(activityUrl).set(authOwner).expect(200);
    await request(app.getHttpServer()).post(commentsUrl).set(authOwner).send({ body: 'No new comment on archive' }).expect(404);
    await request(app.getHttpServer()).patch(`${commentsUrl}/${ownerCommentId}`).set(authOwner).send({ body: 'No edits on archive' }).expect(404);
    await request(app.getHttpServer()).delete(`${commentsUrl}/${ownerCommentId}`).set(authOwner).expect(404);
  });
});
