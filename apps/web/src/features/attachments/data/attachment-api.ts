import type { AttachmentContract, AttachmentMimeType, AttachmentUploadIntentContract } from '@clickflow/contracts';

import { createApiClient } from '@/lib/api/client';
import { apiBaseUrl } from '@/lib/api/environment';

type UploadInput = { taskId: string; fileName: string; mimeType: AttachmentMimeType; byteSize: number };

const client = createApiClient(apiBaseUrl);
const authorized = (accessToken: string) => ({ accessToken });

export const attachmentApi = {
  async upload(accessToken: string, workspaceId: string, taskId: string, file: File): Promise<AttachmentContract> {
    const input: UploadInput = { taskId, fileName: file.name, mimeType: file.type as AttachmentMimeType, byteSize: file.size };
    const intent = await client.post<AttachmentUploadIntentContract>(`/workspaces/${workspaceId}/attachments/upload-intents`, input, authorized(accessToken));
    let upload: Response;
    if (intent.uploadMethod === 'POST') {
      const form = new FormData();
      for (const [key, value] of Object.entries(intent.uploadFields ?? {})) form.append(key, value);
      form.append('file', file);
      upload = await fetch(intent.uploadUrl, { method: 'POST', body: form });
    } else {
      upload = await fetch(intent.uploadUrl, { method: 'PUT', headers: intent.uploadHeaders ?? { 'Content-Type': file.type }, body: file });
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