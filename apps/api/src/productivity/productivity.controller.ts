import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiHeader, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../authorization/authenticated-user';
import { CurrentUser } from '../authorization/current-user.decorator';
import { CurrentWorkspaceId } from '../authorization/current-workspace.decorator';
import { RequireWorkspaceAccess } from '../authorization/workspace-access.decorator';
import { RequireIdempotencyKey } from '../common/idempotency-key';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ArchiveResponseDto, CreateTemplateRequestDto, InstantiateTemplateRequestDto, SettingsResponseDto, TemplateResponseDto, UpdateSettingsRequestDto } from './productivity.dto';
import { createTemplateSchema, type CreateTemplateInput, instantiateTemplateSchema, type InstantiateTemplateInput, updateSettingsSchema, type UpdateSettingsInput } from './productivity.schemas';
import { ArchiveSettingsService } from './archive-settings.service';
import { TemplateService } from './template.service';
type ProductivityRequest = Request & { requestId?: string; idempotencyKey?: string };

@RequireWorkspaceAccess() @ApiBearerAuth() @ApiTags('templates') @Controller('workspaces/:workspaceId/project-templates')
export class TemplateController {
  constructor(@Inject(TemplateService) private readonly templates: TemplateService) {}
  @Get() @ApiOkResponse({ type: [TemplateResponseDto] }) list(@CurrentWorkspaceId() workspaceId: string) { return this.templates.list(workspaceId); }
  @Post() @ApiBody({ type: CreateTemplateRequestDto }) @ApiCreatedResponse({ type: TemplateResponseDto }) create(@CurrentWorkspaceId() workspaceId: string, @Body(new ZodValidationPipe(createTemplateSchema)) input: CreateTemplateInput) { return this.templates.create(workspaceId, input); }
  @Post(':templateId/instantiate') @RequireIdempotencyKey() @ApiHeader({ name: 'Idempotency-Key', required: true }) @ApiBody({ type: InstantiateTemplateRequestDto }) @ApiCreatedResponse({ type: Object }) instantiate(@CurrentWorkspaceId() workspaceId: string, @Param('templateId') id: string, @Body(new ZodValidationPipe(instantiateTemplateSchema)) input: InstantiateTemplateInput, @Req() request: ProductivityRequest) { return this.templates.instantiate(workspaceId, id, request.idempotencyKey!, input); }
  @Delete(':templateId') @HttpCode(HttpStatus.NO_CONTENT) @ApiNoContentResponse() archive(@CurrentWorkspaceId() workspaceId: string, @Param('templateId') id: string) { return this.templates.archive(workspaceId, id); }
}

@RequireWorkspaceAccess() @ApiBearerAuth() @ApiTags('archive and settings') @Controller('workspaces/:workspaceId')
export class ArchiveSettingsController {
  constructor(@Inject(ArchiveSettingsService) private readonly service: ArchiveSettingsService) {}
  @Get('archive') @ApiOkResponse({ type: ArchiveResponseDto }) archive(@CurrentWorkspaceId() workspaceId: string) { return this.service.archive(workspaceId); }
  @Post('archive/:type/:id/restore') @HttpCode(HttpStatus.NO_CONTENT) @ApiNoContentResponse() restore(@CurrentWorkspaceId() workspaceId: string, @CurrentUser() user: AuthenticatedUser, @Param('type') type: 'project' | 'task' | 'template', @Param('id') id: string, @Req() request: ProductivityRequest) { return this.service.restore(workspaceId, user.id, type, id, request.requestId); }
  @Get('settings') @ApiOkResponse({ type: SettingsResponseDto }) settings(@CurrentWorkspaceId() workspaceId: string) { return this.service.getSettings(workspaceId); }
  @Patch('settings') @ApiBody({ type: UpdateSettingsRequestDto }) @ApiOkResponse({ type: SettingsResponseDto }) update(@CurrentWorkspaceId() workspaceId: string, @Body(new ZodValidationPipe(updateSettingsSchema)) input: UpdateSettingsInput) { return this.service.updateSettings(workspaceId, input); }
}
