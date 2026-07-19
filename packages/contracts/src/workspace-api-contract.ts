import type { UtcIsoTimestamp } from './domain-contract';

export type WorkspaceRole = 'OWNER' | 'MEMBER';
export type ProjectHealthStatus = 'ON_TRACK' | 'AT_RISK' | 'OVERDUE' | 'COMPLETED';
export const SPACE_ROOT_PROJECT_TONE = 'system:space-root';


export interface WorkspaceResponse {
  id: string;
  name: string;
  tone: string | null;
  private: boolean;
  timezone: string;
  locale: string;
  role: WorkspaceRole;
  createdAt: UtcIsoTimestamp;
  updatedAt: UtcIsoTimestamp;
}
export interface CreateWorkspaceRequest {
  name: string;
  tone?: string | null;
  private?: boolean;
  timezone?: string;
  locale?: string;
}
export type UpdateWorkspaceRequest = Partial<Pick<CreateWorkspaceRequest, 'name' | 'tone' | 'private'>>;


export interface ProjectHealthResponse {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  progressPercent: number;
  health: ProjectHealthStatus;
}

export interface ProjectResponse {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  tone: string | null;
  position: number;
  deadline: UtcIsoTimestamp | null;
  createdAt: UtcIsoTimestamp;
  updatedAt: UtcIsoTimestamp;
  archivedAt: UtcIsoTimestamp | null;
  health: ProjectHealthResponse;
}

export type ProjectStatusCategory = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';

export interface ProjectStatusResponse {
  id: string;
  projectId: string;
  name: string;
  color: string;
  category: ProjectStatusCategory;
  completed: boolean;
  position: number;
  isSystem: boolean;
}

export interface CreateProjectStatusRequest {
  name: string;
  color: string;
  category: ProjectStatusCategory;
}

export type UpdateProjectStatusRequest = Partial<CreateProjectStatusRequest>;

export interface ProjectListResponse {
  items: ProjectResponse[];
  page: number;
  pageSize: number;
  total: number;
}

export interface SectionResponse {
  id: string;
  projectId: string;
  name: string;
  position: number;
}

export interface CreateProjectRequest {
  name: string;
  description?: string | null;
  tone?: string | null;
  deadline?: UtcIsoTimestamp | null;
}

export type UpdateProjectRequest = Partial<CreateProjectRequest>;
export interface CreateSectionRequest { name: string; }
export type UpdateSectionRequest = Partial<CreateSectionRequest>;
