export interface AuthenticatedUser {
  id: string;
  email?: string;
}

export interface AuthenticatedRequest {
  user?: AuthenticatedUser;
  workspaceId?: string;
  params?: Record<string, string | undefined>;
  body?: Record<string, unknown>;
  query?: Record<string, string | string[] | undefined>;
  headers?: Record<string, string | string[] | undefined>;
  method?: string;
}

