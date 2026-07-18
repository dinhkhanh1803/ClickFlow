import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { assertStoredObject, hasValidMagicBytes } from './attachment-rules';

describe('attachment verification', () => {
  it('accepts known magic bytes and rejects spoofed MIME', () => {
    expect(hasValidMagicBytes('image/png', Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);
    expect(() => assertStoredObject('application/pdf', 8, Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toThrow(BadRequestException);
  });
});
