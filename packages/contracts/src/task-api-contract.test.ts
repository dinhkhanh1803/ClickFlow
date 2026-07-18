import { describe, expect, it } from 'vitest';

import { taskCreateRequestSchema, taskMoveRequestSchema } from './task-api-contract';

describe('Task 6 API contract', () => {
  it('accepts the canonical priority and UTC due timestamp', () => {
    expect(taskCreateRequestSchema.parse({
      projectId: '20000000-0000-4000-8000-000000000001',
      statusId: '40000000-0000-4000-8000-000000000001',
      title: 'Ship task core',
      priority: 'URGENT',
      dueAt: '2026-07-21T10:00:00.000Z'
    }).priority).toBe('URGENT');
  });

  it('requires optimistic concurrency and one ordering anchor', () => {
    const base = {
      version: 2,
      statusId: '40000000-0000-4000-8000-000000000001'
    };
    expect(taskMoveRequestSchema.safeParse(base).success).toBe(true);
    expect(taskMoveRequestSchema.safeParse({ ...base, beforeTaskId: base.statusId, afterTaskId: base.statusId }).success).toBe(false);
    expect(taskMoveRequestSchema.safeParse({ statusId: base.statusId }).success).toBe(false);
  });
});
