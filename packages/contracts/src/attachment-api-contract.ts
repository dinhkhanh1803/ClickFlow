export const attachmentPolicyContract = {
  allowedMimeTypes: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'text/plain',
    'application/zip',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ],
  maxBytes: 100 * 1024 * 1024,
  standardMaxBytes: 25 * 1024 * 1024,
  videoMaxBytes: 100 * 1024 * 1024,
  uploadUrlTtlSeconds: 600,
  downloadUrlTtlSeconds: 300,
  storageKeyPattern: 'workspaces/{workspaceId}/attachments/{uuid}.{ext}'
} as const;

export type AttachmentMimeType = typeof attachmentPolicyContract.allowedMimeTypes[number];

export interface AttachmentContract { id: string; taskId: string; fileName: string; mimeType: AttachmentMimeType; byteSize: string; createdAt: string; }

export interface AttachmentUploadIntentContract {
  storageKey: string;
  uploadUrl: string;
  uploadMethod: 'PUT' | 'POST';
  uploadHeaders?: Record<string, string>;
  uploadFields?: Record<string, string>;
  expiresAt: string;
}