import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(160),
  tone: z.string().trim().max(40).nullable().optional(),
  private: z.boolean().default(true),
  timezone: z.string().trim().min(1).max(100).default('UTC'),
  locale: z.string().trim().min(2).max(35).default('en')
}).strict();

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;


export const updateWorkspaceSchema = createWorkspaceSchema.pick({ name: true, tone: true, private: true }).partial().refine((input) => Object.keys(input).length > 0, 'At least one field is required');
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
