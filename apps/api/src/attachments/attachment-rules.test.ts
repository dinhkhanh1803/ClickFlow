import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { MAX_ATTACHMENT_BYTES, MAX_WORKSPACE_ATTACHMENT_BYTES, assertStoredObject, assertStoredObjectMetadata, hasValidMagicBytes, maxAttachmentBytesForMimeType, storageExtensionForMimeType } from './attachment-rules';

describe('attachment verification', () => {
  it('accepts known magic bytes and rejects spoofed MIME', () => {
    expect(hasValidMagicBytes('image/png', Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);
    expect(() => assertStoredObject('application/pdf', 8, Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toThrow(BadRequestException);
  });

  it('accepts metadata-only verification for remote storage providers', () => {
    expect(() => assertStoredObjectMetadata('image/png', 8)).not.toThrow();
    expect(() => assertStoredObjectMetadata('application/x-msdownload', 2)).toThrow(BadRequestException);
  });

  it('accepts common image and document attachment types within capped sizes', () => {
    expect(storageExtensionForMimeType('image/webp')).toBe('webp');
    expect(storageExtensionForMimeType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('docx');
    expect(storageExtensionForMimeType('text/markdown')).toBe('md');
    expect(maxAttachmentBytesForMimeType('image/png')).toBe(MAX_ATTACHMENT_BYTES);
    expect(MAX_WORKSPACE_ATTACHMENT_BYTES).toBe(500 * 1024 * 1024);

    expect(() => assertStoredObject('text/plain', 5, new TextEncoder().encode('hello'))).not.toThrow();
    expect(() => assertStoredObject('text/markdown', 7, new TextEncoder().encode('# hello'))).not.toThrow();
    expect(() => assertStoredObjectMetadata('video/mp4', 12)).toThrow(BadRequestException);
    expect(() => assertStoredObjectMetadata('image/png', MAX_ATTACHMENT_BYTES + 1)).toThrow(BadRequestException);
    expect(() => assertStoredObject('application/x-msdownload', 2, Uint8Array.from([0x4d, 0x5a]))).toThrow(BadRequestException);
  });
});
