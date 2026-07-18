import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CommentRequestDto {
  @ApiProperty({ type: String, minLength: 1, maxLength: 10_000 }) body!: string;
}

export class CommentAuthorDto {
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiProperty({ type: String }) displayName!: string;
  @ApiProperty({ type: String }) initials!: string;
  @ApiProperty({ type: String, nullable: true }) avatarUrl!: string | null;
}

export class CommentResponseDto {
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiProperty({ type: String, format: 'uuid' }) taskId!: string;
  @ApiProperty({ type: String }) body!: string;
  @ApiProperty({ type: CommentAuthorDto }) author!: CommentAuthorDto;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: Date;
}

export class CommentListResponseDto {
  @ApiProperty({ type: [CommentResponseDto] }) items!: CommentResponseDto[];
  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true }) nextCursor!: string | null;
}

export class ActivityResponseDto {
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiProperty({ type: String }) eventType!: string;
  @ApiProperty({ type: String }) subjectType!: string;
  @ApiProperty({ type: String, format: 'uuid' }) subjectId!: string;
  @ApiProperty({ type: Object }) metadata!: Record<string, unknown>;
  @ApiProperty({ type: CommentAuthorDto, nullable: true }) actor!: CommentAuthorDto | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
}

export class ActivityListResponseDto {
  @ApiProperty({ type: [ActivityResponseDto] }) items!: ActivityResponseDto[];
  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true }) nextCursor!: string | null;
}
