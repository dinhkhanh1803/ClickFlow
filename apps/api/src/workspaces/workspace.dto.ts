import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkspaceRequestDto {
  @ApiProperty({ type: String, maxLength: 160 }) name!: string;
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 40 }) tone?: string | null;
  @ApiPropertyOptional({ type: Boolean, default: true }) private?: boolean;
  @ApiPropertyOptional({ type: String, default: 'UTC', maxLength: 100 }) timezone?: string;
  @ApiPropertyOptional({ type: String, default: 'en', maxLength: 35 }) locale?: string;
}


export class WorkspaceResponseDto {
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiProperty({ type: String }) name!: string;
  @ApiProperty({ type: String, nullable: true }) tone!: string | null;
  @ApiProperty({ type: Boolean }) private!: boolean;
  @ApiProperty({ type: String }) timezone!: string;
  @ApiProperty({ type: String }) locale!: string;
  @ApiProperty({ type: String, enum: ['OWNER', 'MEMBER'] }) role!: string;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: Date;
}

export class WorkspaceMemberResponseDto {
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiProperty({ type: String, format: 'uuid' }) userId!: string;
  @ApiProperty({ type: String }) displayName!: string;
  @ApiProperty({ type: String }) initials!: string;
  @ApiProperty({ type: String, nullable: true }) avatarUrl!: string | null;
  @ApiProperty({ type: String, enum: ['OWNER', 'MEMBER'] }) role!: string;
}
