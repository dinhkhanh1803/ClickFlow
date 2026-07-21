import { describe, expect, it } from 'vitest';

import { buildTaskUpdateActivityMetadata } from './task.service';

describe('task activity metadata', () => {
  it('records assignment and status fields so personal notifications can identify the change', () => {
    expect(buildTaskUpdateActivityMetadata({
      version: 3,
      assigneeId: '11111111-1111-4111-8111-111111111111',
      statusId: '22222222-2222-4222-8222-222222222222',
      title: 'Updated title'
    })).toEqual({
      changedFields: ['assigneeId', 'statusId', 'title'],
      assigneeId: '11111111-1111-4111-8111-111111111111',
      statusId: '22222222-2222-4222-8222-222222222222'
    });
  });
});
