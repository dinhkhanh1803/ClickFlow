import { describe, expect, it } from 'vitest';

import {
  frontendBackendResourceMapping,
  legacyPriorityToApi,
  localPriorityToApi
} from './domain-contract';
import { taskCreateRequestSchema } from './task-api-contract';

describe('frontend/backend domain contract', () => {
  it('locks stable resource names before Prisma', () => {
    expect(frontendBackendResourceMapping).toMatchObject({
      Space: 'Workspace',
      Folder: 'Project',
      List: 'Section',
      Doc: 'Document'
    });
  });

  it('maps current and legacy priorities to the API enum', () => {
    expect(localPriorityToApi).toEqual({ Urgent: 'URGENT', High: 'HIGH', Normal: 'NORMAL', Low: 'LOW' });
    expect(legacyPriorityToApi.medium).toBe('NORMAL');
  });

  it('uses IDs instead of free-text assignees in task requests', () => {
    const request = {
      projectId: '10000000-0000-4000-8000-000000000001',
      statusId: '20000000-0000-4000-8000-000000000001',
      assigneeId: '30000000-0000-4000-8000-000000000001',
      title: 'Draft launch brief',
      priority: 'HIGH'
    };

    expect(taskCreateRequestSchema.safeParse(request).success).toBe(true);
    expect(taskCreateRequestSchema.safeParse({ ...request, assigneeId: 'Khanh' }).success).toBe(false);
  });
});
