import { z } from 'zod';

const uuid = z.string().uuid();
const utcTimestamp = z.string().datetime({ offset: true });

export const startTimerRequestSchema = z.object({
  taskId: uuid,
  note: z.string().trim().max(2_000).nullable().optional()
}).strict();

export const manualTimeEntryRequestSchema = z.object({
  taskId: uuid,
  startedAt: utcTimestamp,
  endedAt: utcTimestamp,
  note: z.string().trim().max(2_000).nullable().optional()
}).strict().refine((value) => new Date(value.startedAt) < new Date(value.endedAt), 'startedAt must be before endedAt');

export interface TimeEntryApiResponse {
  id: string;
  workspaceId: string;
  taskId: string;
  userId: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface CurrentTimerApiResponse {
  timer: TimeEntryApiResponse | null;
}
