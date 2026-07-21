import { BadRequestException } from '@nestjs/common';

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const MAX_WORKSPACE_ATTACHMENT_BYTES = 500 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'text/plain',
  'text/markdown',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
] as const;

export const ATTACHMENT_MIME_EXTENSIONS = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'application/zip': 'zip',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx'
} as const satisfies Record<typeof ALLOWED_ATTACHMENT_MIME_TYPES[number], string>;

const signatures: Partial<Record<keyof typeof ATTACHMENT_MIME_EXTENSIONS, number[][]>> = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'application/zip': [[0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x05, 0x06], [0x50, 0x4b, 0x07, 0x08]],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [[0x50, 0x4b]],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [[0x50, 0x4b]],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': [[0x50, 0x4b]],
};

export function storageExtensionForMimeType(mimeType: string): string {
  const extension = ATTACHMENT_MIME_EXTENSIONS[mimeType as keyof typeof ATTACHMENT_MIME_EXTENSIONS];
  if (!extension) throw new BadRequestException('Attachment MIME type is not allowed');
  return extension;
}

export function maxAttachmentBytesForMimeType(mimeType: string): number {
  return ALLOWED_ATTACHMENT_MIME_TYPES.includes(mimeType as never) ? MAX_ATTACHMENT_BYTES : 0;
}

export function hasValidMagicBytes(mimeType: string, bytes: Uint8Array): boolean {
  const candidates = signatures[mimeType as keyof typeof signatures];
  if (!candidates) return true;
  return candidates.some((signature) => signature.every((value, index) => bytes[index] === value) || bytes.some((value, index) => signature.every((signatureValue, offset) => bytes[index + offset] === signatureValue)));
}

export function assertStoredObjectMetadata(mimeType: string, byteSize: number): void {
  if (!ALLOWED_ATTACHMENT_MIME_TYPES.includes(mimeType as never)) throw new BadRequestException('Attachment MIME type is not allowed');
  if (byteSize < 1 || byteSize > maxAttachmentBytesForMimeType(mimeType)) throw new BadRequestException('Attachment size is invalid');
}

export function assertStoredObject(mimeType: string, byteSize: number, bytes: Uint8Array): void {
  assertStoredObjectMetadata(mimeType, byteSize);
  if (byteSize !== bytes.byteLength) throw new BadRequestException('Attachment size is invalid');
  if (!hasValidMagicBytes(mimeType, bytes)) throw new BadRequestException('Attachment content does not match its MIME type');
}