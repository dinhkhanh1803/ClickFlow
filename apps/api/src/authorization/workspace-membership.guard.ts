import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { AuthenticatedRequest } from './authenticated-user';
import { WORKSPACE_ACCESS_METADATA, type WorkspaceAccessMetadata } from './workspace-access.decorator';
import { WorkspaceMembershipService } from './workspace-membership.service';

@Injectable()
export class WorkspaceMembershipGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(WorkspaceMembershipService) private readonly memberships: WorkspaceMembershipService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride<WorkspaceAccessMetadata>(WORKSPACE_ACCESS_METADATA, [
      context.getHandler(),
      context.getClass()
    ]);
    if (!metadata) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) throw new UnauthorizedException('Authentication is required');
    const workspaceId = this.resolveWorkspaceId(request, metadata);
    if (!workspaceId) throw new BadRequestException('Workspace scope is required');
    if (!await this.memberships.hasAccess(request.user.id, workspaceId)) {
      throw new ForbiddenException('Workspace access denied');
    }
    request.workspaceId = workspaceId;
    return true;
  }

  private resolveWorkspaceId(request: AuthenticatedRequest, metadata: WorkspaceAccessMetadata): string | undefined {
    const source = request[metadata.source];
    const value = source?.[metadata.key];
    if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined;
    return typeof value === 'string' ? value : undefined;
  }
}
