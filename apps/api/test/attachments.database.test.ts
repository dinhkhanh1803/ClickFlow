import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { MemoryStorageProvider } from '../src/attachments/memory-storage.provider';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/database/prisma.service';
import { StructuredLoggerService } from '../src/observability/structured-logger.service';
import { registerVerifiedUser } from './auth-test-helper';

const enabled = process.env.DATABASE_INTEGRATION_TESTS === '1' && Boolean(process.env.DATABASE_URL);
const describeDatabase = enabled ? describe : describe.skip;
const emails = ['task10-user@clickflow.test', 'task10-other@clickflow.test'];
const body = <T>(response: { body: unknown }) => response.body as T;

describeDatabase('Task 10 attachment lifecycle', () => {
  let app: INestApplication; let prisma: PrismaService; let storage: MemoryStorageProvider;
  async function cleanup() { const users = await prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true } }); await prisma.workspace.deleteMany({ where: { createdById: { in: users.map(({ id }) => id) } } }); await prisma.user.deleteMany({ where: { id: { in: users.map(({ id }) => id) } } }); storage.clear(); }
  async function register(email: string) {
    const registered = await registerVerifiedUser(app, prisma, {
      email,
      displayName: email,
      password: 'Task-Ten-Pass-10!'
    });
    return { accessToken: registered.accessToken, user: { id: registered.userId }, workspaceId: registered.workspaceId, headers: registered.headers };
  }
  async function task(user: Awaited<ReturnType<typeof register>>) { const base = `/api/v1/workspaces/${user.workspaceId}`; const project = body<{ id: string }>(await request(app.getHttpServer()).post(`${base}/projects`).set(user.headers).send({ name: 'Files' }).expect(201)); const status = body<{ id: string }>(await request(app.getHttpServer()).post(`${base}/projects/${project.id}/statuses`).set(user.headers).send({ name: 'Open', color: '#64748b', category: 'OPEN' }).expect(201)); const created = body<{ id: string }>(await request(app.getHttpServer()).post(`${base}/tasks`).set(user.headers).send({ projectId: project.id, statusId: status.id, title: 'Attachment task' }).expect(201)); return { base, taskId: created.id }; }
  beforeAll(async () => { const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(StructuredLoggerService).useValue({ log: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn(), verbose: vi.fn(), fatal: vi.fn() }).compile(); app = moduleRef.createNestApplication(); configureApp(app, { corsOrigins: ['http://localhost:3000'] }); await app.init(); prisma = app.get(PrismaService); storage = app.get(MemoryStorageProvider); await cleanup(); });
  afterAll(async () => { await cleanup(); await app.close(); });

  it('verifies content, scopes signed URLs and deletes idempotently', async () => {
    const user = await register(emails[0]!); const other = await register(emails[1]!); const own = await task(user);
    await prisma.workspaceMember.create({ data: { workspaceId: other.workspaceId, userId: user.user.id, role: 'MEMBER' } });
    const spec = { taskId: own.taskId, fileName: '../safe.png', mimeType: 'image/png', byteSize: 8 };
    const intent = body<{ storageKey: string }>(await request(app.getHttpServer()).post(`${own.base}/attachments/upload-intents`).set(user.headers).send(spec).expect(201));
    storage.putObject({ storageKey: intent.storageKey, mimeType: 'image/png', byteSize: 8, bytes: Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0, 0, 0, 0]) });
    await request(app.getHttpServer()).post(`${own.base}/attachments/complete`).set(user.headers).send({ ...spec, storageKey: intent.storageKey }).expect(400);
    storage.putObject({ storageKey: intent.storageKey, mimeType: 'image/png', byteSize: 8, bytes: Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) });
    const attachment = body<{ id: string; byteSize: string }>(await request(app.getHttpServer()).post(`${own.base}/attachments/complete`).set(user.headers).send({ ...spec, storageKey: intent.storageKey }).expect(201));
    expect(attachment.byteSize).toBe('8');
    await request(app.getHttpServer()).get(`${own.base}/attachments/${attachment.id}/download-url`).set(user.headers).expect(200);
    await request(app.getHttpServer()).get(`/api/v1/workspaces/${other.workspaceId}/attachments/${attachment.id}/download-url`).set(user.headers).expect(404);
    await request(app.getHttpServer()).delete(`${own.base}/attachments/${attachment.id}`).set(user.headers).expect(204);
    await request(app.getHttpServer()).delete(`${own.base}/attachments/${attachment.id}`).set(user.headers).expect(204);
    await request(app.getHttpServer()).get(`${own.base}/attachments/${attachment.id}/download-url`).set(user.headers).expect(404);
  });
});
