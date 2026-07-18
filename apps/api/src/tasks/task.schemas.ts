import type { ApiTaskPriority } from '@clickflow/contracts';
import { z } from 'zod';

const uuid = z.string().uuid();
const apiTaskPrioritySchema: z.ZodType<ApiTaskPriority> = z.enum(['URGENT', 'HIGH', 'NORMAL', 'LOW']);
const nullableUuid = uuid.nullable();
const nullableTimestamp = z.union([z.string().datetime({ offset: true }).transform((value) => new Date(value)), z.null()]);
const version = z.number().int().positive();

export const taskListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  projectId: uuid.optional(),
  sectionId: uuid.optional(),
  statusId: uuid.optional(),
  assigneeId: uuid.optional(),
  from: z.string().datetime({ offset: true }).transform((value) => new Date(value)).optional(),
  to: z.string().datetime({ offset: true }).transform((value) => new Date(value)).optional(),
  archived: z.enum(['active', 'archived', 'all']).default('active'),
  search: z.string().trim().max(120).optional()
}).strict().refine((value) => !value.from || !value.to || value.from <= value.to, { message: 'from must be before or equal to to' });

export const createTaskSchema = z.object({
  projectId: uuid,
  sectionId: nullableUuid.optional(),
  statusId: uuid,
  assigneeId: nullableUuid.optional(),
  parentTaskId: nullableUuid.optional(),
  title: z.string().trim().min(1).max(240),
  description: z.string().max(20_000).nullable().optional(),
  priority: apiTaskPrioritySchema.default('NORMAL'),
  dueAt: nullableTimestamp.optional()
}).strict();

export const updateTaskSchema = z.object({
  version,
  sectionId: nullableUuid.optional(),
  statusId: uuid.optional(),
  assigneeId: nullableUuid.optional(),
  parentTaskId: nullableUuid.optional(),
  title: z.string().trim().min(1).max(240).optional(),
  description: z.string().max(20_000).nullable().optional(),
  priority: apiTaskPrioritySchema.optional(),
  dueAt: nullableTimestamp.optional()
}).strict().refine((value) => Object.keys(value).some((key) => key !== 'version'), 'At least one field besides version is required');

export const versionSchema = z.object({ version }).strict();
export const archiveTaskQuerySchema = z.object({ version: z.coerce.number().int().positive() }).strict();
export const completeTaskSchema = z.object({ version, statusId: uuid }).strict();
export const moveTaskSchema = z.object({
  version,
  statusId: uuid,
  sectionId: nullableUuid.optional(),
  beforeTaskId: uuid.optional(),
  afterTaskId: uuid.optional()
}).strict().refine((value) => !(value.beforeTaskId && value.afterTaskId), 'Use at most one ordering anchor');

export const createChecklistItemSchema = z.object({ label: z.string().trim().min(1).max(500) }).strict();
export const updateChecklistItemSchema = z.object({
  label: z.string().trim().min(1).max(500).optional(),
  completed: z.boolean().optional()
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required');

export const createTagSchema = z.object({
  name: z.string().trim().min(1).max(80),
  color: z.string().trim().min(1).max(40)
}).strict();
export const attachTagSchema = z.object({ tagId: uuid }).strict();

export type TaskListInput = z.infer<typeof taskListSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type VersionInput = z.infer<typeof versionSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>;
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type AttachTagInput = z.infer<typeof attachTagSchema>;
