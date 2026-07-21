import type { ArchiveDocumentRequest, CreateDocumentRequest, DocumentResponse, UpdateDocumentRequest } from '@clickflow/contracts';

import { createApiClient } from '@/lib/api/client';
import { apiBaseUrl } from '@/lib/api/environment';

const client = createApiClient(apiBaseUrl);
const authorized = (accessToken: string) => ({ accessToken });

export const documentApi = {
  list(accessToken: string, workspaceId: string): Promise<DocumentResponse[]> {
    return client.get(`/workspaces/${workspaceId}/documents`, authorized(accessToken));
  },
  get(accessToken: string, workspaceId: string, documentId: string): Promise<DocumentResponse> {
    return client.get(`/workspaces/${workspaceId}/documents/${documentId}`, authorized(accessToken));
  },
  create(accessToken: string, workspaceId: string, input: CreateDocumentRequest): Promise<DocumentResponse> {
    return client.post(`/workspaces/${workspaceId}/documents`, input, authorized(accessToken));
  },
  update(accessToken: string, workspaceId: string, documentId: string, input: UpdateDocumentRequest): Promise<DocumentResponse> {
    return client.patch(`/workspaces/${workspaceId}/documents/${documentId}`, input, authorized(accessToken));
  },
  archive(accessToken: string, workspaceId: string, documentId: string, input: ArchiveDocumentRequest): Promise<void> {
    return client.delete(`/workspaces/${workspaceId}/documents/${documentId}`, { ...authorized(accessToken), body: input });
  }
};
