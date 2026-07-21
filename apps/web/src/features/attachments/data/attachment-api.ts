import { attachmentPolicyContract, type AttachmentContract, type AttachmentMimeType, type AttachmentUploadIntentContract } from '@clickflow/contracts';

import { createApiClient } from '@/lib/api/client';
import { apiBaseUrl } from '@/lib/api/environment';

type UploadInput = { taskId: string; fileName: string; mimeType: AttachmentMimeType; byteSize: number };

const client = createApiClient(apiBaseUrl);
const authorized = (accessToken: string) => ({ accessToken });

const attachmentMimeTypesByExtension: Record<string, AttachmentMimeType> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  txt: 'text/plain',
  md: 'text/markdown',
  zip: 'application/zip',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
};

function attachmentMimeType(file: File): AttachmentMimeType {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const inferred = attachmentMimeTypesByExtension[extension];
  if (inferred && (!file.type || file.type === 'application/octet-stream')) return inferred;
  if (attachmentPolicyContract.allowedMimeTypes.includes(file.type as AttachmentMimeType)) return file.type as AttachmentMimeType;
  if (inferred) return inferred;
  throw new Error('Unsupported attachment type');
}

export const attachmentApi = {
  async upload(accessToken: string, workspaceId: string, taskId: string, file: File): Promise<AttachmentContract> {
    const input: UploadInput = { taskId, fileName: file.name, mimeType: attachmentMimeType(file), byteSize: file.size };
    const intent = await client.post<AttachmentUploadIntentContract>(`/workspaces/${workspaceId}/attachments/upload-intents`, input, authorized(accessToken));
    let upload: Response;
    if (intent.uploadMethod === 'POST') {
      const form = new FormData();
      for (const [key, value] of Object.entries(intent.uploadFields ?? {})) form.append(key, value);
      form.append('file', file);
      upload = await fetch(intent.uploadUrl, { method: 'POST', body: form });
    } else {
      upload = await fetch(intent.uploadUrl, { method: 'PUT', headers: intent.uploadHeaders ?? { 'Content-Type': input.mimeType }, body: file });
    }
    if (!upload.ok) throw new Error('The object storage upload failed');
    return client.post(`/workspaces/${workspaceId}/attachments/complete`, { ...input, storageKey: intent.storageKey }, authorized(accessToken));
  },
  downloadUrl(accessToken: string, workspaceId: string, attachmentId: string): Promise<{ downloadUrl: string; expiresAt: string }> {
    return client.get(`/workspaces/${workspaceId}/attachments/${attachmentId}/download-url`, authorized(accessToken));
  },
  remove(accessToken: string, workspaceId: string, attachmentId: string): Promise<void> {
    return client.delete(`/workspaces/${workspaceId}/attachments/${attachmentId}`, authorized(accessToken));
  }
};