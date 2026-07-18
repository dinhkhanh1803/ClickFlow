import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import type { AuthenticatedUser } from '../authorization/authenticated-user';
import { CurrentUser } from '../authorization/current-user.decorator';
import { CurrentWorkspaceId } from '../authorization/current-workspace.decorator';
import { RequireWorkspaceAccess } from '../authorization/workspace-access.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { TaskAccessoryService } from './task-accessory.service';
import { AttachTagRequestDto, ChecklistItemRequestDto, ChecklistItemResponseDto, CompleteTaskRequestDto, CreateTaskRequestDto, MoveTaskRequestDto, TagRequestDto, TagResponseDto, TaskListResponseDto, TaskResponseDto, UpdateChecklistItemRequestDto, UpdateTaskRequestDto, VersionRequestDto } from './task.dto';
import { archiveTaskQuerySchema, attachTagSchema, type AttachTagInput, completeTaskSchema, createChecklistItemSchema, type CreateChecklistItemInput, createTagSchema, type CreateTagInput, createTaskSchema, type CreateTaskInput, moveTaskSchema, type MoveTaskInput, taskListSchema, type TaskListInput, updateChecklistItemSchema, type UpdateChecklistItemInput, updateTaskSchema, type UpdateTaskInput, versionSchema, type VersionInput } from './task.schemas';
import { TaskService } from './task.service';

function context(request: Request) {
  return { requestId: (request as Request & { requestId?: string }).requestId };
}

@RequireWorkspaceAccess()
@ApiTags('tasks')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/tasks')
export class TaskController {
  constructor(
    @Inject(TaskService) private readonly tasks: TaskService,
    @Inject(TaskAccessoryService) private readonly accessories: TaskAccessoryService
  ) {}

  @Get()
  @ApiQuery({ name: 'projectId', required: false, format: 'uuid' })
  @ApiQuery({ name: 'assigneeId', required: false, format: 'uuid' })
  @ApiQuery({ name: 'from', required: false, format: 'date-time' })
  @ApiQuery({ name: 'to', required: false, format: 'date-time' })
  @ApiOkResponse({ type: TaskListResponseDto })
  list(@CurrentWorkspaceId() workspaceId: string, @Query(new ZodValidationPipe(taskListSchema)) query: TaskListInput) {
    return this.tasks.list(workspaceId, query);
  }

  @Get(':taskId')
  @ApiOkResponse({ type: TaskResponseDto })
  get(@CurrentWorkspaceId() workspaceId: string, @Param('taskId') taskId: string) {
    return this.tasks.get(workspaceId, taskId);
  }

  @Post()
  @ApiBody({ type: CreateTaskRequestDto })
  @ApiCreatedResponse({ type: TaskResponseDto })
  create(@CurrentWorkspaceId() workspaceId: string, @CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(createTaskSchema)) input: CreateTaskInput, @Req() request: Request) {
    return this.tasks.create(workspaceId, user.id, input, context(request));
  }

  @Patch(':taskId')
  @ApiBody({ type: UpdateTaskRequestDto })
  @ApiOkResponse({ type: TaskResponseDto })
  update(@CurrentWorkspaceId() workspaceId: string, @Param('taskId') taskId: string, @CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(updateTaskSchema)) input: UpdateTaskInput, @Req() request: Request) {
    return this.tasks.update(workspaceId, taskId, user.id, input, context(request));
  }

  @Post(':taskId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: CompleteTaskRequestDto })
  @ApiOkResponse({ type: TaskResponseDto })
  complete(@CurrentWorkspaceId() workspaceId: string, @Param('taskId') taskId: string, @CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(completeTaskSchema)) input: { version: number; statusId: string }, @Req() request: Request) {
    return this.tasks.complete(workspaceId, taskId, user.id, input, context(request));
  }

  @Post(':taskId/move')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: MoveTaskRequestDto })
  @ApiOkResponse({ type: TaskResponseDto })
  move(@CurrentWorkspaceId() workspaceId: string, @Param('taskId') taskId: string, @CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(moveTaskSchema)) input: MoveTaskInput, @Req() request: Request) {
    return this.tasks.move(workspaceId, taskId, user.id, input, context(request));
  }

  @Delete(':taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiQuery({ name: 'version', required: true, type: Number })
  @ApiNoContentResponse()
  archive(@CurrentWorkspaceId() workspaceId: string, @Param('taskId') taskId: string, @CurrentUser() user: AuthenticatedUser, @Query(new ZodValidationPipe(archiveTaskQuerySchema)) query: VersionInput, @Req() request: Request) {
    return this.tasks.archive(workspaceId, taskId, user.id, query.version, context(request));
  }

  @Post(':taskId/restore')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: VersionRequestDto })
  @ApiOkResponse({ type: TaskResponseDto })
  restore(@CurrentWorkspaceId() workspaceId: string, @Param('taskId') taskId: string, @CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(versionSchema)) input: VersionInput, @Req() request: Request) {
    return this.tasks.restore(workspaceId, taskId, user.id, input.version, context(request));
  }

  @Get(':taskId/checklist-items')
  @ApiOkResponse({ type: [ChecklistItemResponseDto] })
  checklist(@CurrentWorkspaceId() workspaceId: string, @Param('taskId') taskId: string) {
    return this.accessories.listChecklist(workspaceId, taskId);
  }

  @Post(':taskId/checklist-items')
  @ApiBody({ type: ChecklistItemRequestDto })
  @ApiCreatedResponse({ type: ChecklistItemResponseDto })
  createChecklist(@CurrentWorkspaceId() workspaceId: string, @Param('taskId') taskId: string, @CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(createChecklistItemSchema)) input: CreateChecklistItemInput, @Req() request: Request) {
    return this.accessories.createChecklist(workspaceId, taskId, user.id, input, context(request));
  }

  @Patch(':taskId/checklist-items/:itemId')
  @ApiBody({ type: UpdateChecklistItemRequestDto })
  @ApiOkResponse({ type: ChecklistItemResponseDto })
  updateChecklist(@CurrentWorkspaceId() workspaceId: string, @Param('taskId') taskId: string, @Param('itemId') itemId: string, @CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(updateChecklistItemSchema)) input: UpdateChecklistItemInput, @Req() request: Request) {
    return this.accessories.updateChecklist(workspaceId, taskId, itemId, user.id, input, context(request));
  }

  @Delete(':taskId/checklist-items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  deleteChecklist(@CurrentWorkspaceId() workspaceId: string, @Param('taskId') taskId: string, @Param('itemId') itemId: string, @CurrentUser() user: AuthenticatedUser, @Req() request: Request) {
    return this.accessories.deleteChecklist(workspaceId, taskId, itemId, user.id, context(request));
  }

  @Post(':taskId/tags')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: AttachTagRequestDto })
  @ApiNoContentResponse()
  attachTag(@CurrentWorkspaceId() workspaceId: string, @Param('taskId') taskId: string, @CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(attachTagSchema)) input: AttachTagInput, @Req() request: Request) {
    return this.accessories.attachTag(workspaceId, taskId, input.tagId, user.id, context(request));
  }

  @Delete(':taskId/tags/:tagId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  detachTag(@CurrentWorkspaceId() workspaceId: string, @Param('taskId') taskId: string, @Param('tagId') tagId: string, @CurrentUser() user: AuthenticatedUser, @Req() request: Request) {
    return this.accessories.detachTag(workspaceId, taskId, tagId, user.id, context(request));
  }
}

@RequireWorkspaceAccess()
@ApiTags('tags')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/tags')
export class TagController {
  constructor(@Inject(TaskAccessoryService) private readonly accessories: TaskAccessoryService) {}

  @Get()
  @ApiOkResponse({ type: [TagResponseDto] })
  list(@CurrentWorkspaceId() workspaceId: string) { return this.accessories.listTags(workspaceId); }

  @Post()
  @ApiBody({ type: TagRequestDto })
  @ApiCreatedResponse({ type: TagResponseDto })
  create(@CurrentWorkspaceId() workspaceId: string, @CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(createTagSchema)) input: CreateTagInput, @Req() request: Request) {
    return this.accessories.createTag(workspaceId, user.id, input, context(request));
  }
}
