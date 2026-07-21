import { z } from 'zod';

export const workspacePublicAccessSchema = z.enum(['VIEW', 'EDIT']);

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).nullable().optional(),
  tone: z.string().trim().max(40).nullable().optional(),
  private: z.boolean().default(true),
  publicAccess: workspacePublicAccessSchema.default('VIEW'),
  timezone: z.string().trim().min(1).max(100).default('UTC'),
  locale: z.string().trim().min(2).max(35).default('en')
}).strict();

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const updateWorkspaceSchema = createWorkspaceSchema.pick({ name: true, description: true, tone: true, private: true, publicAccess: true }).partial().refine((input) => Object.keys(input).length > 0, 'At least one field is required');
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;

export const inviteWorkspaceMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.literal('MEMBER').default('MEMBER')
}).strict();
export type InviteWorkspaceMemberInput = z.infer<typeof inviteWorkspaceMemberSchema>;


