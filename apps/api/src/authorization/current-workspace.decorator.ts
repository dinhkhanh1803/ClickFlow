import { createParamDecorator, ForbiddenException, type ExecutionContext } from '@nestjs/common';

import type { AuthenticatedRequest } from './authenticated-user';

export const CurrentWorkspaceId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const workspaceId = context.switchToHttp().getRequest<AuthenticatedRequest>().workspaceId;
    if (!workspaceId) throw new ForbiddenException('Workspace authorization is required');
    return workspaceId;
  }
);
