export const templateInstantiationContract = { requiresIdempotencyKey: true, copied: ['statuses', 'sections', 'tasks', 'checklist'], excluded: ['activity', 'comments', 'attachments', 'timeEntries'] } as const;
export const workspaceSettingsSchemaContract = { timezone: 'IANA', locale: 'BCP47', preferenceKeys: ['weekStartsOn', 'dateFormat', 'notifications'] } as const;
export type ArchiveResourceType = 'project' | 'task' | 'template';
