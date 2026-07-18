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

export interface WorkspaceResponse {
  id: string;
  name: string;
  tone: string;
  isPrivate: boolean;
  createdAt: UtcIsoTimestamp;
  updatedAt: UtcIsoTimestamp;
}

export interface WorkspaceTreeNode {
  id: string;
  kind: WorkspaceTreeNodeKind;
  name: string;
  parentId: string | null;
  position: number;
  navigationKind?: NavigationItemKind;
  children: WorkspaceTreeNode[];
}

export interface WorkspaceTreeResponse {
  workspace: WorkspaceResponse;
  nodes: WorkspaceTreeNode[];
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

export const createTaskRequestSchema = z.object({
  sectionId: z.string().uuid(),
  title: z.string().trim().min(1).max(240),
  description: z.string().max(20_000).default(''),
  statusId: z.string().uuid(),
  priority: apiTaskPrioritySchema.default('NORMAL'),
  assigneeId: z.string().uuid().nullable().default(null),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null)
});
export type CreateTaskRequest = z.infer<typeof createTaskRequestSchema>;

export interface TaskResponse {
  id: string;
  workspaceId: string;
  projectId: string;
  sectionId: string;
  title: string;
  description: string;
  status: StatusDefinitionResponse;
  priority: ApiTaskPriority;
  assigneeId: string | null;
  assignee: MemberSummary | null;
  startDate: string | null;
  dueDate: string | null;
  createdAt: UtcIsoTimestamp;
  updatedAt: UtcIsoTimestamp;
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

export const workspaceTreeResponseExample: WorkspaceTreeResponse = {
  workspace: {
    id: '10000000-0000-4000-8000-000000000001',
    name: 'ClickFlow Product',
    tone: 'indigo',
    isPrivate: true,
    createdAt: '2026-07-18T00:00:00.000Z',
    updatedAt: '2026-07-18T00:00:00.000Z'
  },
  nodes: [
    {
      id: '20000000-0000-4000-8000-000000000001',
      kind: 'PROJECT',
      name: 'Projects',
      parentId: null,
      position: 0,
      children: [
        {
          id: '30000000-0000-4000-8000-000000000001',
          kind: 'SECTION',
          name: 'Roadmap',
          parentId: '20000000-0000-4000-8000-000000000001',
          position: 0,
          children: []
        }
      ]
    }
  ]
};

export const createTaskRequestExample: CreateTaskRequest = {
  sectionId: '30000000-0000-4000-8000-000000000001',
  title: 'Draft launch brief',
  description: 'Prepare the first reviewable launch brief.',
  statusId: '40000000-0000-4000-8000-000000000001',
  priority: 'HIGH',
  assigneeId: '50000000-0000-4000-8000-000000000001',
  startDate: '2026-07-18',
  dueDate: '2026-07-21'
};

export const taskResponseExample: TaskResponse = {
  id: '60000000-0000-4000-8000-000000000001',
  workspaceId: '10000000-0000-4000-8000-000000000001',
  projectId: '20000000-0000-4000-8000-000000000001',
  sectionId: '30000000-0000-4000-8000-000000000001',
  title: 'Draft launch brief',
  description: 'Prepare the first reviewable launch brief.',
  status: {
    id: '40000000-0000-4000-8000-000000000001',
    key: 'in-progress',
    name: 'In progress',
    color: 'blue',
    category: 'IN_PROGRESS',
    scopeType: 'SECTION',
    scopeId: '30000000-0000-4000-8000-000000000001',
    position: 1
  },
  priority: 'HIGH',
  assigneeId: '50000000-0000-4000-8000-000000000001',
  assignee: {
    id: '50000000-0000-4000-8000-000000000001',
    displayName: 'Khanh Tran',
    initials: 'KT',
    avatarUrl: null
  },
  startDate: '2026-07-18',
  dueDate: '2026-07-21',
  createdAt: '2026-07-18T00:00:00.000Z',
  updatedAt: '2026-07-18T00:00:00.000Z'
};
