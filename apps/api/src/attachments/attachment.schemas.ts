import { z } from 'zod';
import { ALLOWED_ATTACHMENT_MIME_TYPES, MAX_ATTACHMENT_BYTES } from './attachment-rules';

export const uploadIntentSchema = z.object({ taskId: z.string().uuid(), fileName: z.string().trim().min(1).max(255), mimeType: z.enum(ALLOWED_ATTACHMENT_MIME_TYPES), byteSize: z.number().int().min(1).max(MAX_ATTACHMENT_BYTES) }).strict();
export const completeAttachmentSchema = uploadIntentSchema.extend({ storageKey: z.string().min(1).max(512), checksum: z.string().max(128).optional() }).strict();
export type UploadIntentInput = z.infer<typeof uploadIntentSchema>;
export type CompleteAttachmentInput = z.infer<typeof completeAttachmentSchema>;
