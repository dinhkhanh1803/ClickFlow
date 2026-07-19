import type { UtcIsoTimestamp } from './domain-contract';

export interface DocumentResponse {
  id: string;
  workspaceId: string;
  projectId: string | null;
  sectionId: string | null;
  title: string;
  content: string;
  contentVersion: number;
  createdAt: UtcIsoTimestamp;
  updatedAt: UtcIsoTimestamp;
  archivedAt: UtcIsoTimestamp | null;
}

export interface CreateDocumentRequest {
  title: string;
  projectId?: string | null;
  sectionId?: string | null;
  content?: string;
}

export interface UpdateDocumentRequest {
  contentVersion: number;
  title?: string;
  content?: string;
}

export interface ArchiveDocumentRequest {
  contentVersion: number;
}
