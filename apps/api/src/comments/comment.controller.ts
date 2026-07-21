import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import type { AuthenticatedUser } from '../authorization/authenticated-user';
import { CurrentUser } from '../authorization/current-user.decorator';
import { CurrentWorkspaceId } from '../authorization/current-workspace.decorator';
import { RequireWorkspaceAccess } from '../authorization/workspace-access.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ActivityListResponseDto, CommentListResponseDto, CommentRequestDto, CommentResponseDto } from './comment.dto';
import { CommentService } from './comment.service';
import { activityListSchema, commentListSchema, createCommentSchema, type CreateCommentInput, type CursorPageInput, updateCommentSchema, type UpdateCommentInput } from './comment.schemas';

function context(request: Request) {
  return { requestId: (request as Request & { requestId?: string }).requestId };
}

@RequireWorkspaceAccess()
@ApiTags('comments', 'activity')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/tasks/:taskId')
export class CommentController {
  constructor(@Inject(CommentService) private readonly comments: CommentService) {}

  @Get('comments')
  @ApiQuery({ name: 'cursor', required: false, type: String, format: 'uuid' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: CommentListResponseDto })
  list(@CurrentWorkspaceId() workspaceId: string, @Param('taskId') taskId: string, @Query(new ZodValidationPipe(commentListSchema)) query: CursorPageInput) {
    return this.comments.list(workspaceId, taskId, query);
  }

  @Post('comments')
  @ApiBody({ type: CommentRequestDto })
  @ApiCreatedResponse({ type: CommentResponseDto })
  create(@CurrentWorkspaceId() workspaceId: string, @Param('taskId') taskId: string, @CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(createCommentSchema)) input: CreateCommentInput, @Req() request: Request) {
    return this.comments.create(workspaceId, taskId, user.id, input, context(request));
  }

  @Patch('comments/:commentId')
  @ApiBody({ type: CommentRequestDto })
  @ApiOkResponse({ type: CommentResponseDto })
  update(@CurrentWorkspaceId() workspaceId: string, @Param('taskId') taskId: string, @Param('commentId') commentId: string, @CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(updateCommentSchema)) input: UpdateCommentInput, @Req() request: Request) {
    return this.comments.update(workspaceId, taskId, commentId, user.id, input, context(request));
  }

  @Delete('comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@CurrentWorkspaceId() workspaceId: string, @Param('taskId') taskId: string, @Param('commentId') commentId: string, @CurrentUser() user: AuthenticatedUser, @Req() request: Request) {
    return this.comments.remove(workspaceId, taskId, commentId, user.id, context(request));
  }

  @Get('activity')
  @ApiQuery({ name: 'cursor', required: false, type: String, format: 'uuid' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: ActivityListResponseDto })
  activity(@CurrentWorkspaceId() workspaceId: string, @Param('taskId') taskId: string, @Query(new ZodValidationPipe(activityListSchema)) query: CursorPageInput) {
    return this.comments.activity(workspaceId, taskId, query);
  }
}
