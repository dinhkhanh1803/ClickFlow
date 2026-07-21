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
const emails = ['task9-user@clickflow.test', 'task9-other@clickflow.test'];
const body = <T>(response: { body: unknown }) => response.body as T;

describeDatabase('Task 9 analytics acceptance fixture', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  async function cleanup() {
    const users = await prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true } });
    await prisma.workspace.deleteMany({ where: { createdById: { in: users.map(({ id }) => id) } } });
    await prisma.user.deleteMany({ where: { id: { in: users.map(({ id }) => id) } } });
  }

  async function register(email: string) {
    const registered = await registerVerifiedUser(app, prisma, {
      email,
      displayName: email,
      password: 'Task-Nine-Pass-9!'
    });
    return {
      accessToken: registered.accessToken,
      user: { id: registered.userId },
      workspaceId: registered.workspaceId,
      headers: registered.headers
    };
  }

  async function fixture(user: Awaited<ReturnType<typeof register>>, name: string) {
    const base = `/api/v1/workspaces/${user.workspaceId}`;
    const project = body<{ id: string }>(await request(app.getHttpServer()).post(`${base}/projects`).set(user.headers).send({ name }).expect(201));
    const status = body<{ id: string }>(await request(app.getHttpServer()).post(`${base}/projects/${project.id}/statuses`).set(user.headers).send({ name: 'Open', color: '#64748b', category: 'OPEN' }).expect(201));
    const task = body<{ id: string }>(await request(app.getHttpServer()).post(`${base}/tasks`).set(user.headers).send({ projectId: project.id, statusId: status.id, title: `${name} launch` }).expect(201));
    return { base, projectId: project.id, taskId: task.id };
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(StructuredLoggerService).useValue({ log: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn(), verbose: vi.fn(), fatal: vi.fn() }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app, { corsOrigins: ['http://localhost:3000'] });
    await app.init();
    prisma = app.get(PrismaService);
    await cleanup();
  });

  afterAll(async () => { await cleanup(); await app.close(); });

  it('reconciles dashboard/reports and never leaks another workspace search result', async () => {
    const user = await register(emails[0]!);
    const other = await register(emails[1]!);
    const own = await fixture(user, 'Own Alpha');
    await fixture(other, 'Secret Alpha');
    const now = new Date();
    await prisma.task.update({ where: { id: own.taskId }, data: { dueAt: new Date(now.getTime() + 60_000) } });
    await prisma.timeEntry.create({ data: { workspaceId: user.workspaceId, taskId: own.taskId, userId: user.user.id, startedAt: new Date(now.getTime() - 3_600_000), endedAt: now, durationSeconds: 3600 } });

    const search = body<{ items: Array<{ title: string }>; total: number }>(await request(app.getHttpServer()).get(`${own.base}/search`).query({ q: 'Alpha' }).set(user.headers).expect(200));
    expect(search.items.map(({ title }) => title)).toEqual(expect.arrayContaining(['Own Alpha', 'Own Alpha launch']));
    expect(search.items.some(({ title }) => title.includes('Secret'))).toBe(false);

    const dashboard = body<{ metrics: { activeProjects: number; weeklyHours: number } }>(await request(app.getHttpServer()).get(`${own.base}/dashboard`).set(user.headers).expect(200));
    expect(dashboard.metrics).toMatchObject({ activeProjects: 1, weeklyHours: 1 });

    const range = { from: new Date(now.getTime() - 86_400_000).toISOString(), to: new Date(now.getTime() + 86_400_000).toISOString() };
    const report = body<{ totalSeconds: number; boundary: string; timezone: string }>(await request(app.getHttpServer()).get(`${own.base}/reports/time`).query(range).set(user.headers).expect(200));
    expect(report).toMatchObject({ totalSeconds: 3600, boundary: '[from,to)', timezone: 'UTC' });
  });
});
