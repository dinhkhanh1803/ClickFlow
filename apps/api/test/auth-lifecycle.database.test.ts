import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { FakeMailAdapter, MailAdapter, type PasswordResetMail } from '../src/auth/mail.adapter';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/database/prisma.service';
import { StructuredLoggerService } from '../src/observability/structured-logger.service';

const enabled = process.env.DATABASE_INTEGRATION_TESTS === '1' && Boolean(process.env.DATABASE_URL);
const describeDatabase = enabled ? describe : describe.skip;
const emails = [
  'auth-flow@clickflow.test',
  'auth-reuse@clickflow.test',
  'auth-reset@clickflow.test',
  'auth-expired@clickflow.test',
  'auth-rate@clickflow.test'
];

function cookiesFrom(response: request.Response): string[] {
  const values: unknown = response.headers['set-cookie'];
  return Array.isArray(values) ? values.filter((value): value is string => typeof value === 'string').map((value) => value.split(';')[0] ?? '') : [];
}

describeDatabase('authentication lifecycle', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let sentMail: PasswordResetMail[];

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
    const mail: unknown = app.get(MailAdapter);
    if (!(mail instanceof FakeMailAdapter)) throw new Error('Expected FakeMailAdapter in database tests');
    sentMail = mail.sent;
  });

  afterEach(async () => {
    const users = await prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true } });
    const userIds = users.map(({ id }) => id);
    if (userIds.length > 0) {
      await prisma.workspace.deleteMany({ where: { createdById: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    sentMail.splice(0);
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers, authorizes /users/me, rotates refresh and logs out', async () => {
    const agent = request.agent(app.getHttpServer());
    const registered = await agent.post('/api/v1/auth/register').send({
      email: emails[0],
      displayName: 'Auth Flow',
      password: 'Initial-Pass-9!'
    }).expect(201);

    await agent.get('/api/v1/users/me')
      .set('Authorization', `Bearer ${String(registered.body.accessToken)}`)
      .expect(200)
      .expect(({ body }) => expect(body).toMatchObject({ email: emails[0], displayName: 'Auth Flow' }));

    await agent.get('/api/v1/users/assignable')
      .set('Authorization', `Bearer ${String(registered.body.accessToken)}`)
      .expect(200)
      .expect(({ body }) => expect(body).toEqual(expect.arrayContaining([expect.objectContaining({ email: emails[0], displayName: 'Auth Flow', initials: 'AF' })])));

    const refreshed = await agent.post('/api/v1/auth/refresh')
      .set('x-csrf-token', String(registered.body.csrfToken))
      .expect(200);
    expect(refreshed.body.accessToken).not.toBe(registered.body.accessToken);

    await agent.post('/api/v1/auth/logout')
      .set('x-csrf-token', String(refreshed.body.csrfToken))
      .expect(204);
    await agent.post('/api/v1/auth/refresh')
      .set('x-csrf-token', String(refreshed.body.csrfToken))
      .expect(403);
  });

  it('detects refresh reuse and revokes the token family', async () => {
    const agent = request.agent(app.getHttpServer());
    const registered = await agent.post('/api/v1/auth/register').send({
      email: emails[1],
      displayName: 'Reuse Test',
      password: 'Initial-Pass-9!'
    }).expect(201);
    const originalCookies = cookiesFrom(registered);

    const rotated = await agent.post('/api/v1/auth/refresh')
      .set('x-csrf-token', String(registered.body.csrfToken))
      .expect(200);

    await request(app.getHttpServer()).post('/api/v1/auth/refresh')
      .set('Cookie', originalCookies)
      .set('x-csrf-token', String(registered.body.csrfToken))
      .expect(401);
    await agent.post('/api/v1/auth/refresh')
      .set('x-csrf-token', String(rotated.body.csrfToken))
      .expect(401);
  });

  it('rejects an expired refresh session', async () => {
    const registered = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      email: emails[3],
      displayName: 'Expired Session',
      password: 'Initial-Pass-9!'
    }).expect(201);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: emails[3] }, select: { id: true } });
    await prisma.session.updateMany({ where: { userId: user.id }, data: { expiresAt: new Date(Date.now() - 1_000) } });

    await request(app.getHttpServer()).post('/api/v1/auth/refresh')
      .set('Cookie', cookiesFrom(registered))
      .set('x-csrf-token', String(registered.body.csrfToken))
      .expect(401);
  });

  it('rate-limits repeated login failures by IP and identity', async () => {
    await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      email: emails[4],
      displayName: 'Rate Limit',
      password: 'Initial-Pass-9!'
    }).expect(201);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer()).post('/api/v1/auth/login')
        .send({ email: emails[4], password: 'Wrong-Pass-10!' })
        .expect(401);
    }
    await request(app.getHttpServer()).post('/api/v1/auth/login')
      .send({ email: emails[4], password: 'Wrong-Pass-10!' })
      .expect(429);
  });

  it('keeps forgot-password responses uniform and consumes reset tokens once', async () => {
    await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      email: emails[2],
      displayName: 'Reset Test',
      password: 'Initial-Pass-9!'
    }).expect(201);

    await request(app.getHttpServer()).post('/api/v1/auth/forgot-password').send({ email: 'missing@clickflow.test' })
      .expect(202, { accepted: true });
    await request(app.getHttpServer()).post('/api/v1/auth/forgot-password').send({ email: emails[2] })
      .expect(202, { accepted: true });
    expect(sentMail).toHaveLength(1);
    const resetToken = new URL(sentMail[0]!.resetUrl).searchParams.get('token');
    expect(resetToken).toBeTruthy();

    await request(app.getHttpServer()).post('/api/v1/auth/reset-password').send({
      token: resetToken,
      password: 'Changed-Pass-10!'
    }).expect(200, { accepted: true });
    await request(app.getHttpServer()).post('/api/v1/auth/reset-password').send({
      token: resetToken,
      password: 'Changed-Pass-10!'
    }).expect(401);

    await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: emails[2], password: 'Initial-Pass-9!' }).expect(401);
    await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: emails[2], password: 'Changed-Pass-10!' }).expect(200);
  });
});
