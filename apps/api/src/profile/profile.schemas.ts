import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(120).optional(),
  avatarUrl: z.string().max(1_500_000).refine((value) => value.startsWith('data:image/'), 'Avatar must be an image').nullable().optional()
}).strict().refine((input) => Object.keys(input).length > 0, 'At least one field is required');
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
