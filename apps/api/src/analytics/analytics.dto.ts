import { ApiProperty } from '@nestjs/swagger';

export class DashboardMetricDto {
  @ApiProperty({ type: Number }) activeProjects!: number;
  @ApiProperty({ type: Number }) dueToday!: number;
  @ApiProperty({ type: Number }) overdueTasks!: number;
  @ApiProperty({ type: Number }) weeklyHours!: number;
}

export class ProjectInsightDto {
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiProperty({ type: String }) name!: string;
  @ApiProperty({ type: Number }) totalTasks!: number;
  @ApiProperty({ type: Number }) completedTasks!: number;
  @ApiProperty({ type: Number }) overdueTasks!: number;
  @ApiProperty({ type: Number }) progressPercent!: number;
  @ApiProperty({ type: String, enum: ['ON_TRACK', 'AT_RISK', 'OVERDUE', 'COMPLETED'] }) health!: string;
}

export class DashboardResponseDto {
  @ApiProperty({ type: DashboardMetricDto }) metrics!: DashboardMetricDto;
  @ApiProperty({ type: [ProjectInsightDto] }) projectHealth!: ProjectInsightDto[];
  @ApiProperty({ type: [Object] }) upcomingDeadlines!: Array<Record<string, unknown>>;
  @ApiProperty({ type: String }) timezone!: string;
  @ApiProperty({ type: String, format: 'date-time' }) generatedAt!: Date;
}

export class SearchItemDto {
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiProperty({ type: String, enum: ['PROJECT', 'TASK'] }) type!: string;
  @ApiProperty({ type: String }) title!: string;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) projectId!: string | null;
  @ApiProperty({ type: Number }) rank!: number;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: Date;
}

export class SearchResponseDto {
  @ApiProperty({ type: [SearchItemDto] }) items!: SearchItemDto[];
  @ApiProperty({ type: Number }) page!: number;
  @ApiProperty({ type: Number }) pageSize!: number;
  @ApiProperty({ type: Number }) total!: number;
}

export class TimeReportResponseDto {
  @ApiProperty({ type: Number }) totalSeconds!: number;
  @ApiProperty({ type: Number }) totalHours!: number;
  @ApiProperty({ type: [Object] }) byProject!: Array<Record<string, unknown>>;
  @ApiProperty({ type: [Object] }) byDay!: Array<Record<string, unknown>>;
}

export class ProgressReportResponseDto {
  @ApiProperty({ type: Number }) totalTasks!: number;
  @ApiProperty({ type: Number }) completedTasks!: number;
  @ApiProperty({ type: Number }) completionPercent!: number;
  @ApiProperty({ type: [Object] }) byProject!: Array<Record<string, unknown>>;
}
