import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { createOpenApiDocument } from '../src/openapi/openapi';

async function createTestApp() {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  configureApp(app, { corsOrigins: ['http://localhost:3000'] });
  await app.init();
  return app;
}

describe('API bootstrap', () => {
  it('reports liveness under the versioned API prefix', async () => {
    const app = await createTestApp();

    await request(app.getHttpServer())
      .get('/api/v1/health/live')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({ status: 'ok' });
      });

    await app.close();
  });

  it('reports readiness under the versioned API prefix', async () => {
    const app = await createTestApp();
    await request(app.getHttpServer()).get('/api/v1/health/ready').expect(200, { status: 'ok' });
    await app.close();
  });

  it('returns the standard envelope for an unknown route', async () => {
    const app = await createTestApp();

    await request(app.getHttpServer())
      .get('/api/v1/missing')
      .expect(404)
      .expect(({ body, headers }) => {
        expect(body).toMatchObject({ code: 'NOT_FOUND', message: 'Cannot GET /api/v1/missing' });
        expect(body.requestId).toBe(headers['x-request-id']);
        expect(body).not.toHaveProperty('stack');
      });

    await app.close();
  });

  it('publishes a versioned deterministic OpenAPI contract', async () => {
    const app = await createTestApp();
    const document = createOpenApiDocument(app);

    expect(document.info.version).toBe('1.0.0');
    expect(document.paths).toHaveProperty('/api/v1/health/live');
    expect(document.paths).toHaveProperty('/api/v1/health/ready');
    expect(document.components?.schemas).toHaveProperty('WorkspaceTreeResponse');
    expect(document.components?.schemas).toHaveProperty('CreateTaskRequest');
    expect(document.components?.examples).toHaveProperty('TaskResponse');

    await app.close();
  });
});
