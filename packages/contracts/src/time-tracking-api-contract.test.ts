import { describe, expect, it } from 'vitest';

import { manualTimeEntryRequestSchema, startTimerRequestSchema } from './time-tracking-api-contract';

describe('Task 8 time tracking contract', () => {
  it('requires a task when starting a timer', () => {
    expect(startTimerRequestSchema.safeParse({ taskId: '80000000-0000-4000-8000-000000000001' }).success).toBe(true);
    expect(startTimerRequestSchema.safeParse({}).success).toBe(false);
  });

  it('accepts UTC cross-day entries and rejects non-positive intervals', () => {
    const valid = { taskId: '80000000-0000-4000-8000-000000000001', startedAt: '2026-07-18T23:30:00.000Z', endedAt: '2026-07-19T00:30:00.000Z' };
    expect(manualTimeEntryRequestSchema.safeParse(valid).success).toBe(true);
    expect(manualTimeEntryRequestSchema.safeParse({ ...valid, endedAt: valid.startedAt }).success).toBe(false);
  });
});
