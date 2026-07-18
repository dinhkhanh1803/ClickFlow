export const attachmentPolicyContract = {
  allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  maxBytes: 10 * 1024 * 1024,
  uploadUrlTtlSeconds: 600,
  downloadUrlTtlSeconds: 300,
  storageKeyPattern: 'workspaces/{workspaceId}/attachments/{uuid}'
} as const;

export interface AttachmentContract { id: string; taskId: string; fileName: string; mimeType: typeof attachmentPolicyContract.allowedMimeTypes[number]; byteSize: string; createdAt: string; }
