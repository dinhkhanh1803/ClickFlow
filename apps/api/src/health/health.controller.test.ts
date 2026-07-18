import type { Mocked } from 'vitest';

import type { DatabaseHealthService } from '../database/database-health.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const databaseHealth: Mocked<Pick<DatabaseHealthService, 'assertReady'>> = {
    assertReady: vi.fn()
  };
  const controller = new HealthController(databaseHealth as unknown as DatabaseHealthService);

  beforeEach(() => vi.clearAllMocks());

  it('keeps liveness independent from PostgreSQL', () => {
    expect(controller.live()).toEqual({ status: 'ok' });
    expect(databaseHealth.assertReady).not.toHaveBeenCalled();
  });

  it('checks PostgreSQL for readiness', async () => {
    databaseHealth.assertReady.mockResolvedValue(undefined);
    await expect(controller.ready()).resolves.toEqual({ status: 'ok' });
    expect(databaseHealth.assertReady).toHaveBeenCalledOnce();
  });
});
