import { describe, expect, it } from 'vitest';

import { archiveDocumentSchema, createDocumentSchema, documentListSchema, updateDocumentSchema } from './document.schemas';

describe('document schemas', () => {
  it('normalizes create input and defaults content', () => {
    expect(createDocumentSchema.parse({ title: '  Project brief  ', projectId: null })).toEqual({
      title: 'Project brief',
      projectId: null,
      content: ''
    });
  });

  it('requires optimistic concurrency for updates and archive', () => {
    expect(updateDocumentSchema.safeParse({ title: 'Missing version' }).success).toBe(false);
    expect(updateDocumentSchema.safeParse({ contentVersion: 1 }).success).toBe(false);
    expect(updateDocumentSchema.parse({ contentVersion: 2, content: '<p>Saved</p>' })).toEqual({
      contentVersion: 2,
      content: '<p>Saved</p>'
    });
    expect(archiveDocumentSchema.safeParse({ contentVersion: 0 }).success).toBe(false);
  });

  it('parses the archived query without treating false as true', () => {
    expect(documentListSchema.parse({}).includeArchived).toBe(false);
    expect(documentListSchema.parse({ includeArchived: 'false' }).includeArchived).toBe(false);
    expect(documentListSchema.parse({ includeArchived: 'true' }).includeArchived).toBe(true);
  });

  it('rejects invalid parent identifiers and oversized content', () => {
    expect(createDocumentSchema.safeParse({ title: 'Doc', projectId: 'not-a-uuid' }).success).toBe(false);
    expect(createDocumentSchema.safeParse({ title: 'Doc', content: 'x'.repeat(2_000_001) }).success).toBe(false);
  });
});
