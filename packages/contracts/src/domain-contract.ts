import { z } from 'zod';

export const apiTaskPrioritySchema = z.enum(['URGENT', 'HIGH', 'NORMAL', 'LOW']);
export type ApiTaskPriority = z.infer<typeof apiTaskPrioritySchema>;

export const statusScopeTypeSchema = z.enum(['WORKSPACE', 'PROJECT', 'SECTION']);
export type StatusScopeType = z.infer<typeof statusScopeTypeSchema>;

export const statusCategorySchema = z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED']);
export type StatusCategory = z.infer<typeof statusCategorySchema>;

export const workspaceTreeNodeKindSchema = z.enum([
  'PROJECT',
  'SECTION',
  'DOCUMENT',
  'NAVIGATION_ITEM'
]);
export type WorkspaceTreeNodeKind = z.infer<typeof workspaceTreeNodeKindSchema>;

export const navigationItemKindSchema = z.enum(['DASHBOARD', 'WHITEBOARD', 'FORM']);
export type NavigationItemKind = z.infer<typeof navigationItemKindSchema>;

export type UtcIsoTimestamp = string;

export interface MemberSummary {
  id: string;
  displayName: string;
  initials: string;
  avatarUrl: string | null;
}

export interface StatusDefinitionResponse {
  id: string;
  key: string;
  name: string;
  color: string;
  category: StatusCategory;
  scopeType: StatusScopeType;
  scopeId: string;
  position: number;
}

export const legacyPriorityToApi = {
  low: 'LOW',
  medium: 'NORMAL',
  high: 'HIGH'
} as const satisfies Record<'low' | 'medium' | 'high', ApiTaskPriority>;

export const localPriorityToApi = {
  Urgent: 'URGENT',
  High: 'HIGH',
  Normal: 'NORMAL',
  Low: 'LOW'
} as const satisfies Record<'Urgent' | 'High' | 'Normal' | 'Low', ApiTaskPriority>;

export const frontendBackendResourceMapping = {
  Space: 'Workspace',
  Folder: 'Project',
  List: 'Section',
  Doc: 'Document',
  dashboard: 'WorkspaceNavigationItem',
  whiteboard: 'WorkspaceNavigationItem',
  form: 'WorkspaceNavigationItem'
} as const;
