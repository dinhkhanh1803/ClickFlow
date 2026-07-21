import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import type { AuthenticatedUser } from '../authorization/authenticated-user';
import { CurrentUser } from '../authorization/current-user.decorator';
import { CurrentWorkspaceId } from '../authorization/current-workspace.decorator';
import { RequireWorkspaceAccess } from '../authorization/workspace-access.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CreateProjectRequestDto, DeleteStatusRequestDto, ProjectListResponseDto, ProjectResponseDto, ReorderRequestDto, SectionRequestDto, SectionResponseDto, StatusRequestDto, StatusResponseDto, UpdateProjectRequestDto, UpdateSectionRequestDto, UpdateStatusRequestDto } from './project.dto';
import { createProjectSchema, createSectionSchema, createStatusSchema, deleteStatusSchema, type CreateProjectInput, type CreateSectionInput, type CreateStatusInput, type DeleteStatusInput, projectListSchema, type ProjectListInput, reorderSchema, type ReorderInput, updateProjectSchema, type UpdateProjectInput, updateSectionSchema, type UpdateSectionInput, updateStatusSchema, type UpdateStatusInput } from './project.schemas';
import { ProjectService } from './project.service';
import { ProjectStructureService } from './project-structure.service';

function requestContext(request: Request) {
  return { requestId: (request as Request & { requestId?: string }).requestId };
}

@RequireWorkspaceAccess()
@ApiTags('projects')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/projects')
export class ProjectController {
  constructor(
    @Inject(ProjectService) private readonly projects: ProjectService,
    @Inject(ProjectStructureService) private readonly structure: ProjectStructureService
  ) {}

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'archived', required: false, enum: ['active', 'archived', 'all'] })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['createdAt', 'deadline', 'name', 'updatedAt'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse({ type: ProjectListResponseDto })
  list(@CurrentWorkspaceId() workspaceId: string, @Query(new ZodValidationPipe(projectListSchema)) query: ProjectListInput) {
    return this.projects.list(workspaceId, query);
  }

  @Get(':projectId')
  @ApiOkResponse({ type: ProjectResponseDto })
  get(@CurrentWorkspaceId() workspaceId: string, @Param('projectId') projectId: string) {
    return this.projects.get(workspaceId, projectId);
  }

  @Post()
  @ApiBody({ type: CreateProjectRequestDto })
  @ApiCreatedResponse({ type: ProjectResponseDto })
  create(
    @CurrentWorkspaceId() workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createProjectSchema)) input: CreateProjectInput,
    @Req() request: Request
  ) {
    return this.projects.create(workspaceId, user.id, input, requestContext(request));
  }

  @Patch(':projectId')
  @ApiBody({ type: UpdateProjectRequestDto })
  @ApiOkResponse({ type: ProjectResponseDto })
  update(
    @CurrentWorkspaceId() workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateProjectSchema)) input: UpdateProjectInput,
    @Req() request: Request
  ) {
    return this.projects.update(workspaceId, projectId, user.id, input, requestContext(request));
  }

  @Delete(':projectId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  archive(
    @CurrentWorkspaceId() workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request
  ) {
    return this.projects.archive(workspaceId, projectId, user.id, requestContext(request));
  }

  @Get(':projectId/statuses')
  @ApiOkResponse({ type: [StatusResponseDto] })
  statuses(@CurrentWorkspaceId() workspaceId: string, @Param('projectId') projectId: string) {
    return this.structure.listStatuses(workspaceId, projectId);
  }

  @Post(':projectId/statuses')
  @ApiBody({ type: StatusRequestDto })
  @ApiCreatedResponse({ type: StatusResponseDto })
  createStatus(
    @CurrentWorkspaceId() workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createStatusSchema)) input: CreateStatusInput,
    @Req() request: Request
  ) {
    return this.structure.createStatus(workspaceId, projectId, user.id, input, requestContext(request));
  }

  @Post(':projectId/statuses/reorder')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: ReorderRequestDto })
  @ApiOkResponse({ type: [StatusResponseDto] })
  reorderStatuses(
    @CurrentWorkspaceId() workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(reorderSchema)) input: ReorderInput,
    @Req() request: Request
  ) {
    return this.structure.reorderStatuses(workspaceId, projectId, user.id, input, requestContext(request));
  }

  @Patch(':projectId/statuses/:statusId')
  @ApiBody({ type: UpdateStatusRequestDto })
  @ApiOkResponse({ type: StatusResponseDto })
  updateStatus(
    @CurrentWorkspaceId() workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('statusId') statusId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateStatusSchema)) input: UpdateStatusInput,
    @Req() request: Request
  ) {
    return this.structure.updateStatus(workspaceId, projectId, statusId, user.id, input, requestContext(request));
  }

  @Delete(':projectId/statuses/:statusId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: DeleteStatusRequestDto, required: false })
  @ApiNoContentResponse()
  deleteStatus(
    @CurrentWorkspaceId() workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('statusId') statusId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(deleteStatusSchema)) input: DeleteStatusInput,
    @Req() request: Request
  ) {
    return this.structure.deleteStatus(workspaceId, projectId, statusId, user.id, input, requestContext(request));
  }

  @Get(':projectId/sections')
  @ApiOkResponse({ type: [SectionResponseDto] })
  sections(@CurrentWorkspaceId() workspaceId: string, @Param('projectId') projectId: string) {
    return this.structure.listSections(workspaceId, projectId);
  }

  @Post(':projectId/sections')
  @ApiBody({ type: SectionRequestDto })
  @ApiCreatedResponse({ type: SectionResponseDto })
  createSection(
    @CurrentWorkspaceId() workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createSectionSchema)) input: CreateSectionInput,
    @Req() request: Request
  ) {
    return this.structure.createSection(workspaceId, projectId, user.id, input, requestContext(request));
  }

  @Post(':projectId/sections/reorder')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: ReorderRequestDto })
  @ApiOkResponse({ type: [SectionResponseDto] })
  reorderSections(
    @CurrentWorkspaceId() workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(reorderSchema)) input: ReorderInput,
    @Req() request: Request
  ) {
    return this.structure.reorderSections(workspaceId, projectId, user.id, input, requestContext(request));
  }

  @Patch(':projectId/sections/:sectionId')
  @ApiBody({ type: UpdateSectionRequestDto })
  @ApiOkResponse({ type: SectionResponseDto })
  updateSection(
    @CurrentWorkspaceId() workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateSectionSchema)) input: UpdateSectionInput,
    @Req() request: Request
  ) {
    return this.structure.updateSection(workspaceId, projectId, sectionId, user.id, input, requestContext(request));
  }

  @Delete(':projectId/sections/:sectionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  archiveSection(
    @CurrentWorkspaceId() workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request
  ) {
    return this.structure.archiveSection(workspaceId, projectId, sectionId, user.id, requestContext(request));
  }
}
