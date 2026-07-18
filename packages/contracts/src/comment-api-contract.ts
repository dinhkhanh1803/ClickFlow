import { z } from 'zod';

export const commentBodySchema = z.string().trim().min(1).max(10_000);
export const commentMutationSchema = z.object({ body: commentBodySchema }).strict();
export const cursorPageRequestSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30)
}).strict();

export interface CommentApiResponse {
  id: string;
  taskId: string;
  body: string;
  author: { id: string; displayName: string; initials: string; avatarUrl: string | null };
  createdAt: string;
  updatedAt: string;
}

export interface ActivityApiResponse {
  id: string;
  eventType: string;
  subjectType: string;
  subjectId: string;
  metadata: Record<string, unknown>;
  actor: { id: string; displayName: string; initials: string; avatarUrl: string | null } | null;
  createdAt: string;
}

export interface CursorPageResponse<Item> {
  items: Item[];
  nextCursor: string | null;
}
