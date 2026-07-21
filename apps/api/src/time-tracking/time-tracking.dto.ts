import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartTimerRequestDto {
  @ApiProperty({ type: String, format: 'uuid' }) taskId!: string;
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 2_000 }) note?: string | null;
}

export class CreateTimeEntryRequestDto {
  @ApiProperty({ type: String, format: 'uuid' }) taskId!: string;
  @ApiProperty({ type: String, format: 'date-time' }) startedAt!: string;
  @ApiProperty({ type: String, format: 'date-time' }) endedAt!: string;
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 2_000 }) note?: string | null;
}

export class UpdateTimeEntryRequestDto {
  @ApiPropertyOptional({ type: String, format: 'date-time' }) startedAt?: string;
  @ApiPropertyOptional({ type: String, format: 'date-time' }) endedAt?: string;
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 2_000 }) note?: string | null;
}

export class TimeEntryResponseDto {
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiProperty({ type: String, format: 'uuid' }) workspaceId!: string;
  @ApiProperty({ type: String, format: 'uuid' }) taskId!: string;
  @ApiProperty({ type: String, format: 'uuid' }) userId!: string;
  @ApiProperty({ type: String, format: 'date-time' }) startedAt!: Date;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) endedAt!: Date | null;
  @ApiProperty({ type: Number, nullable: true }) durationSeconds!: number | null;
  @ApiProperty({ type: String, nullable: true }) note!: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: Date;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) archivedAt!: Date | null;
}

export class CurrentTimerResponseDto {
  @ApiProperty({ type: TimeEntryResponseDto, nullable: true }) timer!: TimeEntryResponseDto | null;
}

export class TimeEntryListResponseDto {
  @ApiProperty({ type: [TimeEntryResponseDto] }) items!: TimeEntryResponseDto[];
  @ApiProperty({ type: Number }) page!: number;
  @ApiProperty({ type: Number }) pageSize!: number;
  @ApiProperty({ type: Number }) total!: number;
  @ApiProperty({ type: Number }) totalDurationSeconds!: number;
}
