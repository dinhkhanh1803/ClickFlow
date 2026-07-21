import { z } from 'zod';
import { ALLOWED_ATTACHMENT_MIME_TYPES, MAX_ATTACHMENT_BYTES, maxAttachmentBytesForMimeType } from './attachment-rules';

const uploadBaseSchema = z.object({
  taskId: z.string().uuid(),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(ALLOWED_ATTACHMENT_MIME_TYPES),
  byteSize: z.number().int().min(1).max(MAX_ATTACHMENT_BYTES)
}).strict();

export const uploadIntentSchema = uploadBaseSchema.refine((value) => value.byteSize <= maxAttachmentBytesForMimeType(value.mimeType), { path: ['byteSize'], message: 'Attachment size exceeds the limit for this file type' });
export const completeAttachmentSchema = uploadIntentSchema.and(z.object({ storageKey: z.string().min(1).max(512), checksum: z.string().max(128).optional() }).strict());
export type UploadIntentInput = z.infer<typeof uploadIntentSchema>;
export type CompleteAttachmentInput = z.infer<typeof completeAttachmentSchema>;