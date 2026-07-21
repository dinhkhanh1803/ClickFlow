import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../authorization/authenticated-user';
import { CurrentUser } from '../authorization/current-user.decorator';
import { CurrentWorkspaceId } from '../authorization/current-workspace.decorator';
import { RequireWorkspaceAccess } from '../authorization/workspace-access.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AttachmentResponseDto, CompleteAttachmentRequestDto, DownloadUrlResponseDto, UploadIntentRequestDto, UploadIntentResponseDto } from './attachment.dto';
import { completeAttachmentSchema, type CompleteAttachmentInput, uploadIntentSchema, type UploadIntentInput } from './attachment.schemas';
import { AttachmentService } from './attachment.service';
type AttachmentRequest = Request & { requestId?: string };

@RequireWorkspaceAccess() @ApiTags('attachments') @ApiBearerAuth() @Controller('workspaces/:workspaceId/attachments')
export class AttachmentController {
  constructor(@Inject(AttachmentService) private readonly attachments: AttachmentService) {}
  @Post('upload-intents') @ApiBody({ type: UploadIntentRequestDto }) @ApiCreatedResponse({ type: UploadIntentResponseDto }) intent(@CurrentWorkspaceId() workspaceId: string, @Body(new ZodValidationPipe(uploadIntentSchema)) input: UploadIntentInput) { return this.attachments.createUploadIntent(workspaceId, input); }
  @Post('complete') @ApiBody({ type: CompleteAttachmentRequestDto }) @ApiCreatedResponse({ type: AttachmentResponseDto }) complete(@CurrentWorkspaceId() workspaceId: string, @CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(completeAttachmentSchema)) input: CompleteAttachmentInput, @Req() request: AttachmentRequest) { return this.attachments.complete(workspaceId, user.id, input, { requestId: request.requestId }); }
  @Get(':attachmentId/download-url') @ApiOkResponse({ type: DownloadUrlResponseDto }) download(@CurrentWorkspaceId() workspaceId: string, @Param('attachmentId') attachmentId: string) { return this.attachments.download(workspaceId, attachmentId); }
  @Delete(':attachmentId') @HttpCode(HttpStatus.NO_CONTENT) @ApiNoContentResponse() remove(@CurrentWorkspaceId() workspaceId: string, @CurrentUser() user: AuthenticatedUser, @Param('attachmentId') attachmentId: string, @Req() request: AttachmentRequest) { return this.attachments.remove(workspaceId, user.id, attachmentId, { requestId: request.requestId }); }
}
