import { BadRequestException } from '@nestjs/common';

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;

const signatures: Record<(typeof ALLOWED_ATTACHMENT_MIME_TYPES)[number], number[][]> = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]]
};

export function hasValidMagicBytes(mimeType: string, bytes: Uint8Array): boolean {
  const candidates = signatures[mimeType as keyof typeof signatures];
  return Boolean(candidates?.some((signature) => signature.every((value, index) => bytes[index] === value)));
}

export function assertStoredObject(mimeType: string, byteSize: number, bytes: Uint8Array): void {
  if (!ALLOWED_ATTACHMENT_MIME_TYPES.includes(mimeType as never)) throw new BadRequestException('Attachment MIME type is not allowed');
  if (byteSize < 1 || byteSize > MAX_ATTACHMENT_BYTES || byteSize !== bytes.byteLength) throw new BadRequestException('Attachment size is invalid');
  if (!hasValidMagicBytes(mimeType, bytes)) throw new BadRequestException('Attachment content does not match its MIME type');
}
