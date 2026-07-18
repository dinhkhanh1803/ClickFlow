import { BadRequestException } from '@nestjs/common';

export function assertCompleteReorder(existingIds: string[], orderedIds: string[]): void {
  const existing = new Set(existingIds);
  const ordered = new Set(orderedIds);
  if (existingIds.length !== orderedIds.length || ordered.size !== orderedIds.length
    || orderedIds.some((id) => !existing.has(id))) {
    throw new BadRequestException('Reorder must contain every active resource exactly once');
  }
}
