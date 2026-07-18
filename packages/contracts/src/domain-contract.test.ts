import { describe, expect, it } from 'vitest';

import {
  createTaskRequestExample,
  createTaskRequestSchema,
  frontendBackendResourceMapping,
  legacyPriorityToApi,
  localPriorityToApi
} from './domain-contract';

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

  it('validates the create-task example and rejects free-text assignees', () => {
    expect(createTaskRequestSchema.parse(createTaskRequestExample)).toEqual(createTaskRequestExample);
    expect(createTaskRequestSchema.safeParse({ ...createTaskRequestExample, assigneeId: 'Khanh' }).success).toBe(false);
  });
});
