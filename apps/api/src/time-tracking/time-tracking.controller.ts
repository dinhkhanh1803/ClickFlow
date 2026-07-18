import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiHeader, ApiNoContentResponse, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import type { AuthenticatedUser } from '../authorization/authenticated-user';
import { CurrentUser } from '../authorization/current-user.decorator';
import { CurrentWorkspaceId } from '../authorization/current-workspace.decorator';
import { RequireWorkspaceAccess } from '../authorization/workspace-access.decorator';
import { RequireIdempotencyKey } from '../common/idempotency-key';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CreateTimeEntryRequestDto, CurrentTimerResponseDto, StartTimerRequestDto, TimeEntryListResponseDto, TimeEntryResponseDto, UpdateTimeEntryRequestDto } from './time-tracking.dto';
import { createTimeEntrySchema, type CreateTimeEntryInput, startTimerSchema, type StartTimerInput, stopTimerSchema, timeEntryListSchema, type TimeEntryListInput, updateTimeEntrySchema, type UpdateTimeEntryInput } from './time-tracking.schemas';
import { TimeTrackingService } from './time-tracking.service';

type TrackingRequest = Request & { requestId?: string; idempotencyKey?: string };

function context(request: TrackingRequest) {
  return { requestId: request.requestId };
}

function idempotencyKey(request: TrackingRequest): string {
  if (!request.idempotencyKey) throw new Error('Idempotency guard did not attach a key');
  return request.idempotencyKey;
}

@RequireWorkspaceAccess()
@ApiTags('timers')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/timers')
export class TimerController {
  constructor(@Inject(TimeTrackingService) private readonly tracking: TimeTrackingService) {}

  @Get('current')
  @ApiOkResponse({ type: CurrentTimerResponseDto })
  current(@CurrentWorkspaceId() workspaceId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.tracking.current(workspaceId, user.id);
  }

  @Post('start')
  @RequireIdempotencyKey()
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiBody({ type: StartTimerRequestDto })
  @ApiCreatedResponse({ type: TimeEntryResponseDto })
  start(@CurrentWorkspaceId() workspaceId: string, @CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(startTimerSchema)) input: StartTimerInput, @Req() request: TrackingRequest) {
    return this.tracking.start(workspaceId, user.id, idempotencyKey(request), input, context(request));
  }

  @Post('stop')
  @HttpCode(HttpStatus.OK)
  @RequireIdempotencyKey()
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOkResponse({ type: TimeEntryResponseDto })
  stop(@CurrentWorkspaceId() workspaceId: string, @CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(stopTimerSchema)) _input: Record<string, never>, @Req() request: TrackingRequest) {
    return this.tracking.stop(workspaceId, user.id, idempotencyKey(request), context(request));
  }
}

@RequireWorkspaceAccess()
@ApiTags('time entries')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/time-entries')
export class TimeEntryController {
  constructor(@Inject(TimeTrackingService) private readonly tracking: TimeTrackingService) {}

  @Get()
  @ApiQuery({ name: 'taskId', required: false, type: String, format: 'uuid' })
  @ApiQuery({ name: 'projectId', required: false, type: String, format: 'uuid' })
  @ApiQuery({ name: 'from', required: false, type: String, format: 'date-time' })
  @ApiQuery({ name: 'to', required: false, type: String, format: 'date-time' })
  @ApiOkResponse({ type: TimeEntryListResponseDto })
  list(@CurrentWorkspaceId() workspaceId: string, @CurrentUser() user: AuthenticatedUser, @Query(new ZodValidationPipe(timeEntryListSchema)) query: TimeEntryListInput) {
    return this.tracking.list(workspaceId, user.id, query);
  }

  @Get(':entryId')
  @ApiOkResponse({ type: TimeEntryResponseDto })
  get(@CurrentWorkspaceId() workspaceId: string, @CurrentUser() user: AuthenticatedUser, @Param('entryId') entryId: string) {
    return this.tracking.get(workspaceId, user.id, entryId);
  }

  @Post()
  @ApiBody({ type: CreateTimeEntryRequestDto })
  @ApiCreatedResponse({ type: TimeEntryResponseDto })
  create(@CurrentWorkspaceId() workspaceId: string, @CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(createTimeEntrySchema)) input: CreateTimeEntryInput, @Req() request: TrackingRequest) {
    return this.tracking.create(workspaceId, user.id, input, context(request));
  }

  @Patch(':entryId')
  @ApiBody({ type: UpdateTimeEntryRequestDto })
  @ApiOkResponse({ type: TimeEntryResponseDto })
  update(@CurrentWorkspaceId() workspaceId: string, @CurrentUser() user: AuthenticatedUser, @Param('entryId') entryId: string, @Body(new ZodValidationPipe(updateTimeEntrySchema)) input: UpdateTimeEntryInput, @Req() request: TrackingRequest) {
    return this.tracking.update(workspaceId, user.id, entryId, input, context(request));
  }

  @Delete(':entryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  archive(@CurrentWorkspaceId() workspaceId: string, @CurrentUser() user: AuthenticatedUser, @Param('entryId') entryId: string, @Req() request: TrackingRequest) {
    return this.tracking.archive(workspaceId, user.id, entryId, context(request));
  }
}
