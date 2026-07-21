import { SetMetadata } from '@nestjs/common';

export const WORKSPACE_ACCESS_METADATA = 'clickflow:workspace-access';

export interface WorkspaceAccessMetadata {
  source: 'body' | 'headers' | 'params' | 'query';
  key: string;
}

export const RequireWorkspaceAccess = (
  metadata: WorkspaceAccessMetadata = { source: 'params', key: 'workspaceId' }
) => SetMetadata(WORKSPACE_ACCESS_METADATA, metadata);
