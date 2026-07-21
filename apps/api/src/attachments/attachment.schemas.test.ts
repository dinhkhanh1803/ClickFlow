import { describe, expect, it } from 'vitest';

import { completeAttachmentSchema, uploadIntentSchema } from './attachment.schemas';

describe('attachment schemas', () => {
  const uploadInput = {
    taskId: 'fd42d586-2c07-41e5-890a-4408ef900af5',
    fileName: 'demo.png',
    mimeType: 'image/png',
    byteSize: 8
  };

  it('accepts an upload intent for an allowed attachment type', () => {
    expect(uploadIntentSchema.safeParse(uploadInput).success).toBe(true);
  });

  it('accepts complete requests with upload metadata and storage key', () => {
    const result = completeAttachmentSchema.safeParse({
      ...uploadInput,
      storageKey: 'workspaces/fd42d586-2c07-41e5-890a-4408ef900af5/attachments/file.png'
    });

    expect(result.success).toBe(true);
  });
});