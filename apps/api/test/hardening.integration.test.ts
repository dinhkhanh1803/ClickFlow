import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { DatabaseHealthService } from '../src/database/database-health.service';
import { StructuredLoggerService } from '../src/observability/structured-logger.service';

describe('HTTP hardening', () => {
  it('rejects request bodies above the explicit one MiB limit', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(DatabaseHealthService).useValue({ assertReady: vi.fn() }).overrideProvider(StructuredLoggerService).useValue({ log: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn(), verbose: vi.fn(), fatal: vi.fn() }).compile();
    const app = moduleRef.createNestApplication({ bodyParser: false });
    configureApp(app, { corsOrigins: ['http://localhost:3000'] });
    await app.init();
    await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: 'large@clickflow.test', password: 'x'.repeat(1024 * 1024 + 1) }).expect(413);
    await app.close();
  });
});
