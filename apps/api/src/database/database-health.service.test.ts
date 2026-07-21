import { ServiceUnavailableException } from '@nestjs/common';

import type { PrismaService } from './prisma.service';
import { DatabaseHealthService } from './database-health.service';

describe('DatabaseHealthService', () => {
  it('maps a failed PostgreSQL query to service unavailable', async () => {
    const prisma = { $queryRaw: vi.fn().mockRejectedValue(new Error('connection refused')) };
    const service = new DatabaseHealthService(prisma as unknown as PrismaService);

    await expect(service.assertReady()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
