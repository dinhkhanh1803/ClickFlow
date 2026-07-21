import { ConflictException } from '@nestjs/common';

export interface TimeInterval {
  startedAt: Date;
  endedAt: Date | null;
}

export function durationSeconds(startedAt: Date, endedAt: Date): number {
  const milliseconds = endedAt.getTime() - startedAt.getTime();
  if (milliseconds < 0) throw new ConflictException('Timer end must be after its start');
  return Math.max(1, Math.floor(milliseconds / 1000));
}

export function assertValidManualInterval(startedAt: Date, endedAt: Date): void {
  if (startedAt >= endedAt) throw new ConflictException('startedAt must be before endedAt');
}

export function intervalsOverlap(candidate: TimeInterval, existing: TimeInterval): boolean {
  const candidateEnd = candidate.endedAt?.getTime() ?? Number.POSITIVE_INFINITY;
  const existingEnd = existing.endedAt?.getTime() ?? Number.POSITIVE_INFINITY;
  return candidate.startedAt.getTime() < existingEnd && existing.startedAt.getTime() < candidateEnd;
}
