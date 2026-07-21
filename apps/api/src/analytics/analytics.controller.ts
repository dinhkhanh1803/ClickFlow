import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CurrentWorkspaceId } from '../authorization/current-workspace.decorator';
import { RequireWorkspaceAccess } from '../authorization/workspace-access.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { DashboardResponseDto, ProgressReportResponseDto, SearchResponseDto, TimeReportResponseDto } from './analytics.dto';
import { reportSchema, type ReportInput, searchSchema, type SearchInput } from './analytics.schemas';
import { AnalyticsService } from './analytics.service';

@RequireWorkspaceAccess()
@ApiTags('analytics')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId')
export class AnalyticsController {
  constructor(@Inject(AnalyticsService) private readonly analytics: AnalyticsService) {}
  @Get('dashboard') @ApiOkResponse({ type: DashboardResponseDto }) dashboard(@CurrentWorkspaceId() workspaceId: string) { return this.analytics.dashboard(workspaceId); }
  @Get('search') @ApiOkResponse({ type: SearchResponseDto }) search(@CurrentWorkspaceId() workspaceId: string, @Query(new ZodValidationPipe(searchSchema)) query: SearchInput) { return this.analytics.search(workspaceId, query); }
  @Get('reports/time') @ApiOkResponse({ type: TimeReportResponseDto }) timeReport(@CurrentWorkspaceId() workspaceId: string, @Query(new ZodValidationPipe(reportSchema)) query: ReportInput) { return this.analytics.timeReport(workspaceId, query); }
  @Get('reports/progress') @ApiOkResponse({ type: ProgressReportResponseDto }) progressReport(@CurrentWorkspaceId() workspaceId: string, @Query(new ZodValidationPipe(reportSchema)) query: ReportInput) { return this.analytics.progressReport(workspaceId, query); }
}
