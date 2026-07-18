import { ForbiddenException } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';

export function assertCanUpdateComment(actorId: string, authorId: string): void {
  if (actorId !== authorId) throw new ForbiddenException('Only the comment author can update it');
}

export function assertCanDeleteComment(actorId: string, authorId: string, role: WorkspaceRole): void {
  if (actorId !== authorId && role !== WorkspaceRole.OWNER) {
    throw new ForbiddenException('Only the comment author or a workspace owner can delete it');
  }
}
