import { describe, expect, it } from 'vitest';

import { commentMutationSchema, cursorPageRequestSchema } from './comment-api-contract';

describe('Task 7 comment and activity contract', () => {
  it('validates plain comment length and trims boundary whitespace', () => {
    expect(commentMutationSchema.parse({ body: '  Review this  ' }).body).toBe('Review this');
    expect(commentMutationSchema.safeParse({ body: '' }).success).toBe(false);
    expect(commentMutationSchema.safeParse({ body: 'x'.repeat(10_001) }).success).toBe(false);
  });

  it('defaults and bounds cursor pagination', () => {
    expect(cursorPageRequestSchema.parse({})).toEqual({ limit: 30 });
    expect(cursorPageRequestSchema.safeParse({ limit: 101 }).success).toBe(false);
    expect(cursorPageRequestSchema.safeParse({ cursor: 'not-a-uuid' }).success).toBe(false);
  });
});
