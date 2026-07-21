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
const emails = ['task8-user@clickflow.test', 'task8-other@clickflow.test'];

function responseBody<T>(response: { body: unknown }): T {
  return response.body as T;
}

describeDatabase('Task 8 timer and time-entry HTTP lifecycle', () => {
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
      password: 'Task-Eight-Pass-9!'
    });
    return { accessToken: registered.accessToken, userId: registered.userId, workspaceId: registered.workspaceId };
  }

  async function createTask(base: string, authorization: Record<string, string>, name: string) {
    const project = await request(app.getHttpServer()).post(`${base}/projects`).set(authorization).send({ name }).expect(201);
    const projectId = responseBody<{ id: string }>(project).id;
    const status = await request(app.getHttpServer()).post(`${base}/projects/${projectId}/statuses`).set(authorization).send({ name: 'Open', color: '#64748b', category: 'OPEN' }).expect(201);
    const task = await request(app.getHttpServer()).post(`${base}/tasks`).set(authorization).send({ projectId, statusId: responseBody<{ id: string }>(status).id, title: `${name} task` }).expect(201);
    return { projectId, taskId: responseBody<{ id: string }>(task).id };
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

  it('enforces one running timer, idempotent retry, manual intervals, UTC filters and isolation', async () => {
    const user = await register(emails[0]!, 'Timer User');
    const other = await register(emails[1]!, 'Other User');
    await prisma.workspaceMember.create({ data: { workspaceId: other.workspaceId, userId: user.userId, role: 'MEMBER' } });
    const authUser = { Authorization: `Bearer ${user.accessToken}` };
    const authOther = { Authorization: `Bearer ${other.accessToken}` };
    const userBase = `/api/v1/workspaces/${user.workspaceId}`;
    const otherBase = `/api/v1/workspaces/${other.workspaceId}`;
    const userTask = await createTask(userBase, authUser, 'User Workspace');
    const otherTask = await createTask(otherBase, authOther, 'Other Workspace');

    await request(app.getHttpServer()).post(`${userBase}/timers/start`).set(authUser).send({ taskId: userTask.taskId }).expect(400);

    const starts = await Promise.all([
      request(app.getHttpServer()).post(`${userBase}/timers/start`).set(authUser).set('Idempotency-Key', 'timer-start-user-0001').send({ taskId: userTask.taskId }),
      request(app.getHttpServer()).post(`${otherBase}/timers/start`).set(authUser).set('Idempotency-Key', 'timer-start-other-0001').send({ taskId: otherTask.taskId })
    ]);
    expect(starts.map(({ status }) => status).sort()).toEqual([201, 409]);
    const winnerIndex = starts.findIndex(({ status }) => status === 201);
    const winner = starts[winnerIndex]!;
    const winnerBase = winnerIndex === 0 ? userBase : otherBase;
    const winnerTaskId = winnerIndex === 0 ? userTask.taskId : otherTask.taskId;
    const winnerKey = winnerIndex === 0 ? 'timer-start-user-0001' : 'timer-start-other-0001';
    const timerId = responseBody<{ id: string }>(winner).id;

    const retry = await request(app.getHttpServer()).post(`${winnerBase}/timers/start`).set(authUser).set('Idempotency-Key', winnerKey).send({ taskId: winnerTaskId }).expect(201);
    expect(responseBody<{ id: string }>(retry).id).toBe(timerId);
    const current = await request(app.getHttpServer()).get(`${winnerBase}/timers/current`).set(authUser).expect(200);
    expect(responseBody<{ timer: { id: string } | null }>(current).timer?.id).toBe(timerId);
    expect(await prisma.timeEntry.count({ where: { userId: user.userId, endedAt: null, archivedAt: null } })).toBe(1);

    await expect(prisma.timeEntry.create({ data: { workspaceId: user.workspaceId, taskId: userTask.taskId, userId: user.userId, startedAt: new Date() } })).rejects.toMatchObject({ code: 'P2002' });

    const stopped = await request(app.getHttpServer()).post(`${winnerBase}/timers/stop`).set(authUser).set('Idempotency-Key', 'timer-stop-user-0001').send({}).expect(200);
    const stoppedBody = responseBody<{ id: string; durationSeconds: number; endedAt: string | null }>(stopped);
    expect(stoppedBody).toMatchObject({ id: timerId });
    expect(stoppedBody.durationSeconds).toBeGreaterThan(0);
    expect(stoppedBody.endedAt).toBeTruthy();
    const stopRetry = await request(app.getHttpServer()).post(`${winnerBase}/timers/stop`).set(authUser).set('Idempotency-Key', 'timer-stop-user-0001').send({}).expect(200);
    expect(responseBody<{ id: string }>(stopRetry).id).toBe(timerId);
    await request(app.getHttpServer()).post(`${winnerBase}/timers/stop`).set(authUser).set('Idempotency-Key', 'timer-stop-user-0002').send({}).expect(409);

    await request(app.getHttpServer()).post(`${userBase}/time-entries`).set(authUser).send({ taskId: otherTask.taskId, startedAt: '2026-07-19T02:00:00.000Z', endedAt: '2026-07-19T03:00:00.000Z' }).expect(404);

    const manual = await request(app.getHttpServer()).post(`${userBase}/time-entries`).set(authUser).send({
      taskId: userTask.taskId,
      startedAt: '2026-07-18T23:30:00.000Z',
      endedAt: '2026-07-19T00:30:00.000Z',
      note: 'Cross-midnight UTC'
    }).expect(201);
    const manualBody = responseBody<{ id: string; durationSeconds: number }>(manual);
    expect(manualBody.durationSeconds).toBe(3_600);
    await request(app.getHttpServer()).post(`${userBase}/time-entries`).set(authUser).send({ taskId: userTask.taskId, startedAt: '2026-07-19T00:00:00.000Z', endedAt: '2026-07-19T01:00:00.000Z' }).expect(409);
    const adjacent = await request(app.getHttpServer()).post(`${userBase}/time-entries`).set(authUser).send({ taskId: userTask.taskId, startedAt: '2026-07-19T00:30:00.000Z', endedAt: '2026-07-19T01:00:00.000Z' }).expect(201);
    const adjacentId = responseBody<{ id: string }>(adjacent).id;
    await request(app.getHttpServer()).patch(`${userBase}/time-entries/${adjacentId}`).set(authUser).send({ startedAt: '2026-07-19T00:15:00.000Z' }).expect(409);

    const report = await request(app.getHttpServer()).get(`${userBase}/time-entries?projectId=${userTask.projectId}&from=2026-07-19T00:00:00.000Z&to=2026-07-20T00:00:00.000Z`).set(authUser).expect(200);
    const reportBody = responseBody<{ items: Array<{ id: string }>; totalDurationSeconds: number }>(report);
    expect(reportBody.items.map(({ id }) => id)).toEqual(expect.arrayContaining([manualBody.id, adjacentId]));
    expect(reportBody.totalDurationSeconds).toBe(5_400);

    await request(app.getHttpServer()).get(`${userBase}/time-entries/${manualBody.id}`).set(authOther).expect(403);
    await request(app.getHttpServer()).get(`${otherBase}/time-entries/${manualBody.id}`).set(authUser).expect(404);
    await request(app.getHttpServer()).delete(`${userBase}/time-entries/${manualBody.id}`).set(authUser).expect(204);
    const active = await request(app.getHttpServer()).get(`${userBase}/time-entries?taskId=${userTask.taskId}`).set(authUser).expect(200);
    expect(responseBody<{ items: Array<{ id: string }> }>(active).items.some(({ id }) => id === manualBody.id)).toBe(false);

    const activityEvents = await prisma.activityLog.findMany({ where: { actorId: user.userId, eventType: { in: ['TIMER_STARTED', 'TIMER_STOPPED', 'TIME_ENTRY_CREATED', 'TIME_ENTRY_ARCHIVED'] } }, select: { eventType: true } });
    expect(activityEvents.map(({ eventType }) => eventType)).toEqual(expect.arrayContaining(['TIMER_STARTED', 'TIMER_STOPPED', 'TIME_ENTRY_CREATED', 'TIME_ENTRY_ARCHIVED']));
  });
});
