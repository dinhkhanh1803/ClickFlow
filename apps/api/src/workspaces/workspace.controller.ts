import { Controller, Get, Inject } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type { AuthenticatedUser } from '../authorization/authenticated-user';
import { CurrentUser } from '../authorization/current-user.decorator';
import { CurrentWorkspaceId } from '../authorization/current-workspace.decorator';
import { RequireWorkspaceAccess } from '../authorization/workspace-access.decorator';
import { WorkspaceMemberResponseDto, WorkspaceResponseDto } from './workspace.dto';
import { WorkspaceService } from './workspace.service';

@ApiTags('workspaces')
@ApiBearerAuth()
@Controller('workspaces')
export class WorkspaceController {
  constructor(@Inject(WorkspaceService) private readonly workspaces: WorkspaceService) {}

  @Get()
  @ApiOkResponse({ type: [WorkspaceResponseDto] })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.workspaces.listForUser(user.id);
  }

  @Get(':workspaceId')
  @RequireWorkspaceAccess()
  @ApiOkResponse({ type: WorkspaceResponseDto })
  get(@CurrentWorkspaceId() workspaceId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.workspaces.getById(workspaceId, user.id);
  }

  @Get(':workspaceId/members')
  @RequireWorkspaceAccess()
  @ApiOkResponse({ type: [WorkspaceMemberResponseDto] })
  members(@CurrentWorkspaceId() workspaceId: string) {
    return this.workspaces.listMembers(workspaceId);
  }
}
