import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type { AuthenticatedUser } from '../authorization/authenticated-user';
import { CurrentUser } from '../authorization/current-user.decorator';
import { CurrentWorkspaceId } from '../authorization/current-workspace.decorator';
import { RequireWorkspaceAccess } from '../authorization/workspace-access.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CreateWorkspaceRequestDto, UpdateWorkspaceRequestDto, WorkspaceMemberResponseDto, WorkspaceResponseDto } from './workspace.dto';
import { createWorkspaceSchema, type CreateWorkspaceInput, updateWorkspaceSchema, type UpdateWorkspaceInput } from './workspace.schemas';
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

  @Post()
  @ApiBody({ type: CreateWorkspaceRequestDto })
  @ApiCreatedResponse({ type: WorkspaceResponseDto })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createWorkspaceSchema)) input: CreateWorkspaceInput
  ) {
    return this.workspaces.create(user.id, input);
  }

  @Get(':workspaceId')
  @RequireWorkspaceAccess()
  @ApiOkResponse({ type: WorkspaceResponseDto })
  get(@CurrentWorkspaceId() workspaceId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.workspaces.getById(workspaceId, user.id);
  }

  @Patch(':workspaceId')
  @RequireWorkspaceAccess()
  @ApiBody({ type: UpdateWorkspaceRequestDto })
  @ApiOkResponse({ type: WorkspaceResponseDto })
  update(@CurrentWorkspaceId() workspaceId: string, @CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(updateWorkspaceSchema)) input: UpdateWorkspaceInput) {
    return this.workspaces.update(workspaceId, user.id, input);
  }

  @Delete(':workspaceId')
  @RequireWorkspaceAccess()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  archive(@CurrentWorkspaceId() workspaceId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.workspaces.archive(workspaceId, user.id);
  }

  @Get(':workspaceId/members')
  @RequireWorkspaceAccess()
  @ApiOkResponse({ type: [WorkspaceMemberResponseDto] })
  members(@CurrentWorkspaceId() workspaceId: string) {
    return this.workspaces.listMembers(workspaceId);
  }
}
