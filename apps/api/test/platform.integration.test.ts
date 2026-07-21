import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { DatabaseHealthService } from '../src/database/database-health.service';
import { PrismaService } from '../src/database/prisma.service';
import { StructuredLoggerService } from '../src/observability/structured-logger.service';
import { createOpenApiDocument } from '../src/openapi/openapi';

const silentLogger = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  verbose: vi.fn(),
  fatal: vi.fn()
};

async function createTestApp(bodyParser = true) {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(DatabaseHealthService)
    .useValue({ assertReady: vi.fn().mockResolvedValue(undefined) })
    .overrideProvider(PrismaService)
    .useValue({ $queryRaw: vi.fn().mockResolvedValue([{ activeConnections: 1, connectionLimit: 100 }]) })
    .overrideProvider(StructuredLoggerService)
    .useValue(silentLogger)
    .compile();
  const app = moduleRef.createNestApplication({ bodyParser });
  configureApp(app, { corsOrigins: ['http://localhost:3000'] });
  await app.init();
  return app;
}

describe('API platform', () => {
  it('reports liveness and readiness under the versioned prefix', async () => {
    const app = await createTestApp();
    await request(app.getHttpServer()).get('/api/v1/health/live').expect(200, { status: 'ok' });
    await request(app.getHttpServer()).get('/api/v1/health/ready').expect(200, { status: 'ok' });
    await app.close();
  });

  it('returns a standard request-correlated error envelope', async () => {
    const app = await createTestApp();
    const requestId = 'integration-request-01HZY8WGW0R0K6AS9K5MY6Q8DK';
    await request(app.getHttpServer())
      .get('/api/v1/missing')
      .set('x-request-id', requestId)
      .expect('x-request-id', requestId)
      .expect(404)
      .expect(({ body }) => {
        expect(body).toMatchObject({ code: 'NOT_FOUND', message: 'Cannot GET /api/v1/missing', requestId });
        expect(body).not.toHaveProperty('stack');
      });
    await app.close();
  });

  it('publishes OpenAPI directly from the runtime DTOs', async () => {
    const app = await createTestApp();
    const document = createOpenApiDocument(app);

    expect(document.info.version).toBe('1.0.0');
    expect(document.paths).toHaveProperty('/api/v1/health/live');
    expect(document.paths).toHaveProperty('/api/v1/auth/login');
    expect(document.paths).toHaveProperty('/api/v1/users/me');
    expect(document.paths).toHaveProperty('/api/v1/workspaces');
    expect(document.paths).toHaveProperty('/api/v1/workspaces/{workspaceId}/projects');
    expect(document.paths).toHaveProperty('/api/v1/workspaces/{workspaceId}/tasks');
    expect(document.components?.schemas).toHaveProperty('CreateTaskRequestDto');
    expect(document.components?.schemas).toHaveProperty('TaskResponseDto');

    await app.close();
  });

  it('reports request and PostgreSQL connection metrics', async () => {
    const app = await createTestApp();
    await request(app.getHttpServer()).get('/api/v1/health/live').expect(200);
    await request(app.getHttpServer())
      .get('/api/v1/metrics')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({ databaseConnections: 1, databaseConnectionLimit: 100 });
        expect(body.requestsTotal).toBeGreaterThanOrEqual(1);
      });
    await app.close();
  });

  it('rejects request bodies above the explicit one MiB limit', async () => {
    const app = await createTestApp(false);
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'large@clickflow.test', password: 'x'.repeat(1024 * 1024 + 1) })
      .expect(413);
    await app.close();
  });
});
