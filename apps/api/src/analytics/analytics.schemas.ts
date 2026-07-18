import { z } from 'zod';

const uuid = z.string().uuid();
const timestamp = z.string().datetime({ offset: true }).transform((value) => new Date(value));

export const searchSchema = z.object({
  q: z.string().trim().min(2).max(120),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  includeArchived: z.enum(['true', 'false']).transform((value) => value === 'true').default('false')
}).strict();

export const reportSchema = z.object({
  from: timestamp,
  to: timestamp,
  projectId: uuid.optional()
}).strict().refine((value) => value.from < value.to, { message: 'from must be before to' });

export type SearchInput = z.infer<typeof searchSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
