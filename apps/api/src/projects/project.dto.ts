import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateProjectRequestDto {
  @ApiProperty({ type: String, maxLength: 160 }) name!: string;
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 5000 }) description?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) tone?: string | null;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true }) deadline?: string | null;
}

export class UpdateProjectRequestDto extends PartialType(CreateProjectRequestDto) {}

export class ProjectHealthDto {
  @ApiProperty({ type: Number }) totalTasks!: number;
  @ApiProperty({ type: Number }) completedTasks!: number;
  @ApiProperty({ type: Number }) overdueTasks!: number;
  @ApiProperty({ type: Number }) progressPercent!: number;
  @ApiProperty({ type: String, enum: ['ON_TRACK', 'AT_RISK', 'OVERDUE', 'COMPLETED'] }) health!: string;
}

export class ProjectResponseDto {
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiProperty({ type: String, format: 'uuid' }) workspaceId!: string;
  @ApiProperty({ type: String }) name!: string;
  @ApiProperty({ type: String, nullable: true }) description!: string | null;
  @ApiProperty({ type: String, nullable: true }) tone!: string | null;
  @ApiProperty({ type: Number }) position!: number;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) deadline!: Date | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: Date;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) archivedAt!: Date | null;
  @ApiProperty({ type: ProjectHealthDto }) health!: ProjectHealthDto;
}

export class ProjectListResponseDto {
  @ApiProperty({ type: [ProjectResponseDto] }) items!: ProjectResponseDto[];
  @ApiProperty({ type: Number }) page!: number;
  @ApiProperty({ type: Number }) pageSize!: number;
  @ApiProperty({ type: Number }) total!: number;
}

export class StatusRequestDto {
  @ApiProperty({ type: String, maxLength: 80 }) name!: string;
  @ApiProperty({ type: String }) color!: string;
  @ApiProperty({ type: String, enum: ['OPEN', 'IN_PROGRESS', 'COMPLETED'] }) category!: string;
}

export class UpdateStatusRequestDto extends PartialType(StatusRequestDto) {}

export class StatusResponseDto {
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiProperty({ type: String, format: 'uuid' }) projectId!: string;
  @ApiProperty({ type: String }) name!: string;
  @ApiProperty({ type: String }) color!: string;
  @ApiProperty({ type: String }) category!: string;
  @ApiProperty({ type: Boolean }) completed!: boolean;
  @ApiProperty({ type: Number }) position!: number;
  @ApiProperty({ type: Boolean }) isSystem!: boolean;
}

export class SectionRequestDto {
  @ApiProperty({ type: String, maxLength: 160 }) name!: string;
}

export class UpdateSectionRequestDto extends PartialType(SectionRequestDto) {}

export class SectionResponseDto {
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiProperty({ type: String, format: 'uuid' }) projectId!: string;
  @ApiProperty({ type: String }) name!: string;
  @ApiProperty({ type: Number }) position!: number;
}

export class ReorderRequestDto {
  @ApiProperty({ type: [String], format: 'uuid' }) orderedIds!: string[];
}

export class DeleteStatusRequestDto {
  @ApiPropertyOptional({ type: String, format: 'uuid' }) replacementStatusId?: string;
}
