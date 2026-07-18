import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskRequestDto {
  @ApiProperty({ type: String, format: 'uuid' }) projectId!: string;
  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true }) sectionId?: string | null;
  @ApiProperty({ type: String, format: 'uuid' }) statusId!: string;
  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true }) assigneeId?: string | null;
  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true }) parentTaskId?: string | null;
  @ApiProperty({ type: String, maxLength: 240 }) title!: string;
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 20_000 }) description?: string | null;
  @ApiPropertyOptional({ type: String, enum: ['URGENT', 'HIGH', 'NORMAL', 'LOW'], default: 'NORMAL' }) priority?: string;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true }) dueAt?: string | null;
}

export class UpdateTaskRequestDto {
  @ApiProperty({ type: Number }) version!: number;
  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true }) sectionId?: string | null;
  @ApiPropertyOptional({ type: String, format: 'uuid' }) statusId?: string;
  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true }) assigneeId?: string | null;
  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true }) parentTaskId?: string | null;
  @ApiPropertyOptional({ type: String, maxLength: 240 }) title?: string;
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 20_000 }) description?: string | null;
  @ApiPropertyOptional({ type: String, enum: ['URGENT', 'HIGH', 'NORMAL', 'LOW'] }) priority?: string;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true }) dueAt?: string | null;
}

export class VersionRequestDto { @ApiProperty({ type: Number }) version!: number; }
export class CompleteTaskRequestDto extends VersionRequestDto { @ApiProperty({ type: String, format: 'uuid' }) statusId!: string; }
export class MoveTaskRequestDto extends VersionRequestDto {
  @ApiProperty({ type: String, format: 'uuid' }) statusId!: string;
  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true }) sectionId?: string | null;
  @ApiPropertyOptional({ type: String, format: 'uuid' }) beforeTaskId?: string;
  @ApiPropertyOptional({ type: String, format: 'uuid' }) afterTaskId?: string;
}

export class MemberSummaryDto {
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiProperty({ type: String }) displayName!: string;
  @ApiProperty({ type: String }) initials!: string;
  @ApiProperty({ type: String, nullable: true }) avatarUrl!: string | null;
}

export class TaskResponseDto {
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiProperty({ type: String, format: 'uuid' }) workspaceId!: string;
  @ApiProperty({ type: String, format: 'uuid' }) projectId!: string;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) sectionId!: string | null;
  @ApiProperty({ type: String, format: 'uuid' }) statusId!: string;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) assigneeId!: string | null;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) parentTaskId!: string | null;
  @ApiProperty({ type: String }) title!: string;
  @ApiProperty({ type: String, nullable: true }) description!: string | null;
  @ApiProperty({ type: String, enum: ['URGENT', 'HIGH', 'NORMAL', 'LOW'] }) priority!: string;
  @ApiProperty({ type: Number }) position!: number;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) dueAt!: Date | null;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) completedAt!: Date | null;
  @ApiProperty({ type: Number }) version!: number;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: Date;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) archivedAt!: Date | null;
  @ApiProperty({ type: MemberSummaryDto, nullable: true }) assignee!: MemberSummaryDto | null;
}

export class TaskListResponseDto {
  @ApiProperty({ type: [TaskResponseDto] }) items!: TaskResponseDto[];
  @ApiProperty({ type: Number }) page!: number;
  @ApiProperty({ type: Number }) pageSize!: number;
  @ApiProperty({ type: Number }) total!: number;
}

export class ChecklistItemRequestDto { @ApiProperty({ type: String, maxLength: 500 }) label!: string; }
export class UpdateChecklistItemRequestDto {
  @ApiPropertyOptional({ type: String, maxLength: 500 }) label?: string;
  @ApiPropertyOptional({ type: Boolean }) completed?: boolean;
}
export class ChecklistItemResponseDto {
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiProperty({ type: String, format: 'uuid' }) taskId!: string;
  @ApiProperty({ type: String }) label!: string;
  @ApiProperty({ type: Boolean }) completed!: boolean;
  @ApiProperty({ type: Number }) position!: number;
}

export class TagRequestDto {
  @ApiProperty({ type: String, maxLength: 80 }) name!: string;
  @ApiProperty({ type: String }) color!: string;
}
export class TagResponseDto {
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiProperty({ type: String }) name!: string;
  @ApiProperty({ type: String }) color!: string;
}
export class AttachTagRequestDto { @ApiProperty({ type: String, format: 'uuid' }) tagId!: string; }
