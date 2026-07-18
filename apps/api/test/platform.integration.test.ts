import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { DatabaseHealthService } from '../src/database/database-health.service';
import { PrismaService } from '../src/database/prisma.service';
import { StructuredLoggerService } from '../src/observability/structured-logger.service';

async function createTestApp() {
  const silentLogger = { log: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn(), verbose: vi.fn(), fatal: vi.fn() };
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(DatabaseHealthService)
    .useValue({ assertReady: vi.fn().mockResolvedValue(undefined) })
    .overrideProvider(PrismaService)
    .useValue({ $queryRaw: vi.fn().mockResolvedValue([{ activeConnections: 1, connectionLimit: 100 }]) })
    .overrideProvider(StructuredLoggerService)
    .useValue(silentLogger)
    .compile();
  const app = moduleRef.createNestApplication();
  configureApp(app, { corsOrigins: ['http://localhost:3000'] });
  await app.init();
  return app;
}

describe('cross-cutting platform', () => {
  it('preserves a bounded request ID in the standard error envelope', async () => {
    const app = await createTestApp();
    const requestId = 'integration-request-01HZY8WGW0R0K6AS9K5MY6Q8DK';
    await request(app.getHttpServer())
      .get('/api/v1/missing')
      .set('x-request-id', requestId)
      .expect('x-request-id', requestId)
      .expect(404)
      .expect(({ body }) => expect(body).toMatchObject({ code: 'NOT_FOUND', requestId }));
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
});
