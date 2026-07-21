import { z } from 'zod';

const uuid = z.string().uuid();
const content = z.string().max(2_000_000);

export const documentListSchema = z.object({
  projectId: uuid.optional(),
  includeArchived: z.preprocess((value) => value === true || value === 'true', z.boolean())
}).strict();

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1).max(240),
  projectId: uuid.nullable().optional(),
  sectionId: uuid.nullable().optional(),
  content: content.default('')
}).strict();

export const updateDocumentSchema = z.object({
  contentVersion: z.number().int().positive(),
  title: z.string().trim().min(1).max(240).optional(),
  content: content.optional()
}).strict().refine((value) => value.title !== undefined || value.content !== undefined, 'At least one field is required');

export const archiveDocumentSchema = z.object({ contentVersion: z.number().int().positive() }).strict();

export type DocumentListInput = z.infer<typeof documentListSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
