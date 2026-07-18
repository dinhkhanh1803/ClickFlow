import { BadRequestException, ForbiddenException, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';

import type { WorkspaceMembershipService } from './workspace-membership.service';
import { WorkspaceMembershipGuard } from './workspace-membership.guard';

function context(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => function handler() {},
    getClass: () => class Controller {}
  } as unknown as ExecutionContext;
}

describe('WorkspaceMembershipGuard', () => {
  const reflector = { getAllAndOverride: vi.fn().mockReturnValue({ source: 'params', key: 'workspaceId' }) };
  const memberships = { hasAccess: vi.fn() };
  const guard = new WorkspaceMembershipGuard(
    reflector as unknown as Reflector,
    memberships as unknown as WorkspaceMembershipService
  );

  beforeEach(() => vi.clearAllMocks());

  it('requires an authenticated user', async () => {
    await expect(guard.canActivate(context({ params: { workspaceId: 'workspace-a' } }))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('requires an explicit workspace scope', async () => {
    await expect(guard.canActivate(context({ user: { id: 'user-a' }, params: {} }))).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks cross-workspace access', async () => {
    memberships.hasAccess.mockResolvedValue(false);
    await expect(guard.canActivate(context({ user: { id: 'user-a' }, params: { workspaceId: 'workspace-b' } }))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows a member and records the authorized scope', async () => {
    const request = { user: { id: 'user-a' }, params: { workspaceId: 'workspace-a' } };
    memberships.hasAccess.mockResolvedValue(true);
    await expect(guard.canActivate(context(request))).resolves.toBe(true);
    expect(request).toHaveProperty('workspaceId', 'workspace-a');
  });
});
