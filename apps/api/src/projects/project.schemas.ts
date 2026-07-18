import type { StatusCategory } from '@clickflow/contracts';
import { z } from 'zod';

const uuid = z.string().uuid();
const publicStatusCategorySchema: z.ZodType<StatusCategory> = z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED']);
const nullableDeadline = z.union([z.string().datetime({ offset: true }).transform((value) => new Date(value)), z.null()]);

export const projectListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  archived: z.enum(['active', 'all', 'archived']).default('active'),
  sortBy: z.enum(['createdAt', 'deadline', 'name', 'updatedAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
}).strict();

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(5_000).nullable().optional(),
  tone: z.string().trim().max(40).nullable().optional(),
  deadline: nullableDeadline.optional()
}).strict();

export const updateProjectSchema = createProjectSchema.partial().refine((value) => Object.keys(value).length > 0, 'At least one field is required');

export const createStatusSchema = z.object({
  name: z.string().trim().min(1).max(80),
  color: z.string().trim().min(1).max(40),
  category: publicStatusCategorySchema.default('OPEN')
}).strict();

export const updateStatusSchema = createStatusSchema.partial().refine((value) => Object.keys(value).length > 0, 'At least one field is required');
export const reorderSchema = z.object({ orderedIds: z.array(uuid).min(1).max(500) }).strict();
export const deleteStatusSchema = z.object({ replacementStatusId: uuid.optional() }).strict().default({});

export const createSectionSchema = z.object({ name: z.string().trim().min(1).max(160) }).strict();
export const updateSectionSchema = createSectionSchema.partial().refine((value) => Object.keys(value).length > 0, 'At least one field is required');

export type ProjectListInput = z.infer<typeof projectListSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateStatusInput = z.infer<typeof createStatusSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type ReorderInput = z.infer<typeof reorderSchema>;
export type DeleteStatusInput = z.infer<typeof deleteStatusSchema>;
export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
