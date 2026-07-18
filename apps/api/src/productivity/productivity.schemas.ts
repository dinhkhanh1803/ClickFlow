import { z } from 'zod';

const uuid = z.string().uuid();
export const createTemplateSchema = z.object({ sourceProjectId: uuid, name: z.string().trim().min(1).max(160), description: z.string().trim().max(5000).nullable().optional() }).strict();
export const instantiateTemplateSchema = z.object({ name: z.string().trim().min(1).max(160).optional() }).strict();
export const restoreSchema = z.object({ type: z.enum(['project', 'task', 'template']), id: uuid }).strict();
export const updateSettingsSchema = z.object({
  timezone: z.string().trim().min(1).max(80).optional(),
  locale: z.string().trim().min(2).max(35).optional(),
  preferences: z.object({ weekStartsOn: z.number().int().min(0).max(6).optional(), dateFormat: z.enum(['locale', 'yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy']).optional(), notifications: z.boolean().optional() }).strict().optional()
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one setting is required');

export const templateStructureSchema = z.object({
  version: z.literal(1),
  project: z.object({ description: z.string().nullable(), tone: z.string().nullable() }),
  statuses: z.array(z.object({ sourceId: uuid, name: z.string(), color: z.string(), category: z.enum(['NOT_STARTED', 'ACTIVE', 'DONE', 'CLOSED']), completed: z.boolean(), position: z.number().int() })),
  sections: z.array(z.object({ sourceId: uuid, name: z.string(), position: z.number().int() })),
  tasks: z.array(z.object({ sourceId: uuid, title: z.string(), description: z.string().nullable(), priority: z.enum(['URGENT', 'HIGH', 'NORMAL', 'LOW']), position: z.string(), statusSourceId: uuid, sectionSourceId: uuid.nullable(), parentSourceId: uuid.nullable(), checklist: z.array(z.object({ label: z.string(), completed: z.boolean(), position: z.number().int() })) }))
});
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type InstantiateTemplateInput = z.infer<typeof instantiateTemplateSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type TemplateStructure = z.infer<typeof templateStructureSchema>;
