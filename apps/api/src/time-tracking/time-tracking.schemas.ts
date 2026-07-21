import { z } from 'zod';

const uuid = z.string().uuid();
const timestamp = z.string().datetime({ offset: true }).transform((value) => new Date(value));

export const startTimerSchema = z.object({
  taskId: uuid,
  note: z.string().trim().max(2_000).nullable().optional()
}).strict();

export const stopTimerSchema = z.object({}).strict().default({});

export const createTimeEntrySchema = z.object({
  taskId: uuid,
  startedAt: timestamp,
  endedAt: timestamp,
  note: z.string().trim().max(2_000).nullable().optional()
}).strict().refine((value) => value.startedAt < value.endedAt, { message: 'startedAt must be before endedAt' });

export const updateTimeEntrySchema = z.object({
  startedAt: timestamp.optional(),
  endedAt: timestamp.optional(),
  note: z.string().trim().max(2_000).nullable().optional()
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required');

export const timeEntryListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  taskId: uuid.optional(),
  projectId: uuid.optional(),
  from: timestamp.optional(),
  to: timestamp.optional(),
  archived: z.enum(['active', 'archived', 'all']).default('active')
}).strict().refine((value) => !value.from || !value.to || value.from < value.to, { message: 'from must be before to' });

export type StartTimerInput = z.infer<typeof startTimerSchema>;
export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;
export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>;
export type TimeEntryListInput = z.infer<typeof timeEntryListSchema>;
