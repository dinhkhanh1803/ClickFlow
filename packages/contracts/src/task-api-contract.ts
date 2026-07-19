import { z } from 'zod';

import { apiTaskPrioritySchema } from './domain-contract';

const uuid = z.string().uuid();
const nullableUuid = uuid.nullable();
const nullableUtcTimestamp = z.string().datetime({ offset: true }).nullable();

export const taskCreateRequestSchema = z.object({
  projectId: uuid,
  sectionId: nullableUuid.optional(),
  statusId: uuid,
  assigneeId: nullableUuid.optional(),
  parentTaskId: nullableUuid.optional(),
  title: z.string().trim().min(1).max(240),
  description: z.string().max(20_000).nullable().optional(),
  priority: apiTaskPrioritySchema.default('NORMAL'),
  dueAt: nullableUtcTimestamp.optional()
}).strict();

export const taskMutationVersionSchema = z.number().int().positive();

export const taskMoveRequestSchema = z.object({
  version: taskMutationVersionSchema,
  statusId: uuid,
  sectionId: nullableUuid.optional(),
  beforeTaskId: uuid.optional(),
  afterTaskId: uuid.optional()
}).strict().refine((value) => !(value.beforeTaskId && value.afterTaskId), 'Use at most one ordering anchor');

export type TaskCreateRequest = z.input<typeof taskCreateRequestSchema>;
export type TaskMoveRequest = z.infer<typeof taskMoveRequestSchema>;

export interface TaskApiResponse {
  id: string;
  workspaceId: string;
  projectId: string;
  sectionId: string | null;
  statusId: string;
  assigneeId: string | null;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  priority: z.infer<typeof apiTaskPrioritySchema>;
  position: number;
  dueAt: string | null;
  completedAt: string | null;
  version: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskListResponse {
  items: TaskApiResponse[];
  page: number;
  pageSize: number;
  total: number;
}

export interface TaskUpdateRequest {
  version: number;
  sectionId?: string | null;
  statusId?: string;
  assigneeId?: string | null;
  parentTaskId?: string | null;
  title?: string;
  description?: string | null;
  priority?: z.infer<typeof apiTaskPrioritySchema>;
  dueAt?: string | null;
}
