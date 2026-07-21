import { PrismaClient } from '@prisma/client';

import { DatabaseHealthService } from '../src/database/database-health.service';
import type { PrismaService } from '../src/database/prisma.service';

const enabled = process.env.DATABASE_INTEGRATION_TESTS === '1' && Boolean(process.env.DATABASE_URL);
const describeDatabase = enabled ? describe : describe.skip;

describeDatabase('database readiness', () => {
  const prisma = new PrismaClient();

  afterAll(() => prisma.$disconnect());

  it('executes a PostgreSQL query before reporting ready', async () => {
    const health = new DatabaseHealthService(prisma as PrismaService);
    await expect(health.assertReady()).resolves.toBeUndefined();
  });
});
