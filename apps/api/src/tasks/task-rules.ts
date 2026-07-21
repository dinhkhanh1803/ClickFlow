import { ConflictException } from '@nestjs/common';

export const MAX_SUBTASK_DEPTH = 5;

export interface TaskAncestor {
  id: string;
  projectId: string;
  parentTaskId: string | null;
}

export function resolveCompletedAt(completed: boolean, current: Date | null, now: Date): Date | null {
  if (!completed) return null;
  return current ?? now;
}

export function assertValidParent(
  taskId: string | null,
  projectId: string,
  parentId: string | null,
  ancestors: ReadonlyMap<string, TaskAncestor>
): void {
  if (!parentId) return;
  if (taskId === parentId) throw new ConflictException('A task cannot be its own parent');

  let currentId: string | null = parentId;
  const visited = new Set<string>();
  let depth = 0;
  while (currentId) {
    if (visited.has(currentId) || currentId === taskId) throw new ConflictException('Subtask hierarchy would contain a cycle');
    visited.add(currentId);
    const current = ancestors.get(currentId);
    if (!current || current.projectId !== projectId) {
      throw new ConflictException('Parent task must belong to the same active project');
    }
    depth += 1;
    if (depth > MAX_SUBTASK_DEPTH) throw new ConflictException(`Subtask depth cannot exceed ${MAX_SUBTASK_DEPTH}`);
    currentId = current.parentTaskId;
  }
}

export function fractionalPosition(previous: number | null, next: number | null): number {
  if (previous === null && next === null) return 1024;
  if (previous === null) return next! - 1024;
  if (next === null) return previous + 1024;
  if (previous >= next) throw new ConflictException('Invalid task ordering anchors');
  const position = (previous + next) / 2;
  if (position === previous || position === next) throw new ConflictException('Task ordering needs a controlled rebalance');
  return position;
}
