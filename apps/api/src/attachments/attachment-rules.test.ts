import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { assertStoredObject, hasValidMagicBytes, maxAttachmentBytesForMimeType, storageExtensionForMimeType } from './attachment-rules';

describe('attachment verification', () => {
  it('accepts known magic bytes and rejects spoofed MIME', () => {
    expect(hasValidMagicBytes('image/png', Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);
    expect(() => assertStoredObject('application/pdf', 8, Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toThrow(BadRequestException);
  });

  it('accepts common image, video, and raw file attachment types', () => {
    expect(storageExtensionForMimeType('image/webp')).toBe('webp');
    expect(storageExtensionForMimeType('video/mp4')).toBe('mp4');
    expect(storageExtensionForMimeType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('docx');
    expect(maxAttachmentBytesForMimeType('video/mp4')).toBeGreaterThan(maxAttachmentBytesForMimeType('image/png'));

    expect(() => assertStoredObject('video/mp4', 12, Uint8Array.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]))).not.toThrow();
    expect(() => assertStoredObject('text/plain', 5, new TextEncoder().encode('hello'))).not.toThrow();
    expect(() => assertStoredObject('application/x-msdownload', 2, Uint8Array.from([0x4d, 0x5a]))).toThrow(BadRequestException);
  });
});