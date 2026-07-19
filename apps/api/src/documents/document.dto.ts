import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentRequestDto {
  @ApiProperty({ type: String }) title!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) projectId?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) sectionId?: string | null;
  @ApiPropertyOptional({ type: String }) content?: string;
}

export class UpdateDocumentRequestDto {
  @ApiProperty({ type: Number }) contentVersion!: number;
  @ApiPropertyOptional({ type: String }) title?: string;
  @ApiPropertyOptional({ type: String }) content?: string;
}

export class ArchiveDocumentRequestDto {
  @ApiProperty({ type: Number }) contentVersion!: number;
}

export class DocumentResponseDto {
  @ApiProperty({ type: String }) id!: string;
  @ApiProperty({ type: String }) workspaceId!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) projectId!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) sectionId!: string | null;
  @ApiProperty({ type: String }) title!: string;
  @ApiProperty({ type: String }) content!: string;
  @ApiProperty({ type: Number }) contentVersion!: number;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: Date;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true }) archivedAt!: Date | null;
}
