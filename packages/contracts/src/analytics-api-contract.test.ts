import { describe, expect, it } from 'vitest';

import { analyticsRangeContract, analyticsSearchQuerySchema } from './analytics-api-contract';

describe('analytics API contract', () => {
  it('bounds and normalizes search input', () => {
    expect(analyticsSearchQuerySchema.parse({ q: ' launch ', page: 1, pageSize: 20 })).toEqual({ q: 'launch', page: 1, pageSize: 20, includeArchived: false });
    expect(() => analyticsSearchQuerySchema.parse({ q: '%', page: 1, pageSize: 101 })).toThrow();
  });

  it('publishes half-open UTC aggregation boundaries', () => {
    expect(analyticsRangeContract).toEqual({ boundary: '[from,to)', aggregationTimezone: 'UTC', displayTimezone: 'workspace.timezone' });
  });
});
