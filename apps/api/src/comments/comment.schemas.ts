import { z } from 'zod';

const cursorPageSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30)
}).strict();

function containsUnsupportedControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return (code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127;
  });
}

const plainText = z.string().trim().min(1).max(10_000).refine(
  (value) => !containsUnsupportedControlCharacter(value),
  'Comment contains unsupported control characters'
);

export const commentListSchema = cursorPageSchema;
export const activityListSchema = cursorPageSchema;
export const createCommentSchema = z.object({ body: plainText }).strict();
export const updateCommentSchema = z.object({ body: plainText }).strict();

export type CursorPageInput = z.infer<typeof cursorPageSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
