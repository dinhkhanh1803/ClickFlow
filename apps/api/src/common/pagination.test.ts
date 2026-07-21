import { BadRequestException } from '@nestjs/common';

import { buildAllowedFilter, buildPaginationQuery } from './pagination';

describe('buildPaginationQuery', () => {
  it('caps page size and maps an allowlisted stable sort', () => {
    expect(buildPaginationQuery(
      { page: 2, pageSize: 500, sortBy: 'updatedAt', sortOrder: 'desc' },
      ['updatedAt', 'title'] as const
    )).toEqual({ skip: 100, take: 100, orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }] });
  });

  it('rejects sort fields outside the allowlist', () => {
    expect(() => buildPaginationQuery(
      { page: 1, pageSize: 20, sortBy: 'passwordHash', sortOrder: 'asc' },
      ['updatedAt', 'title'] as const
    )).toThrow(BadRequestException);
  });
});

describe('buildAllowedFilter', () => {
  it('maps only an allowlisted filter field', () => {
    expect(buildAllowedFilter({ filterBy: 'statusId', filterValue: 'status-a' }, ['statusId', 'assigneeId'] as const))
      .toEqual({ statusId: 'status-a' });
  });

  it('rejects filter fields outside the allowlist', () => {
    expect(() => buildAllowedFilter({ filterBy: 'workspaceId', filterValue: 'other-workspace' }, ['statusId'] as const))
      .toThrow(BadRequestException);
  });
});
