import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkspaceRequestDto {
  @ApiProperty({ type: String, maxLength: 160 }) name!: string;
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 2000 }) description?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 40 }) tone?: string | null;
  @ApiPropertyOptional({ type: Boolean, default: true }) private?: boolean;
  @ApiPropertyOptional({ type: String, enum: ['VIEW', 'EDIT'], default: 'VIEW' }) publicAccess?: string;
  @ApiPropertyOptional({ type: String, default: 'UTC', maxLength: 100 }) timezone?: string;
  @ApiPropertyOptional({ type: String, default: 'en', maxLength: 35 }) locale?: string;
}

export class UpdateWorkspaceRequestDto {
  @ApiPropertyOptional({ type: String, maxLength: 160 }) name?: string;
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 2000 }) description?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 40 }) tone?: string | null;
  @ApiPropertyOptional({ type: Boolean }) private?: boolean;
  @ApiPropertyOptional({ type: String, enum: ['VIEW', 'EDIT'] }) publicAccess?: string;
}

export class WorkspaceCreatorResponseDto {
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiProperty({ type: String }) displayName!: string;
  @ApiProperty({ type: String, nullable: true }) avatarUrl!: string | null;
}

export class WorkspaceResponseDto {
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiProperty({ type: String }) name!: string;
  @ApiProperty({ type: String, nullable: true }) description!: string | null;
  @ApiProperty({ type: String, nullable: true }) tone!: string | null;
  @ApiProperty({ type: Boolean }) private!: boolean;
  @ApiProperty({ type: String, enum: ['VIEW', 'EDIT'] }) publicAccess!: string;
  @ApiProperty({ type: String }) timezone!: string;
  @ApiProperty({ type: String }) locale!: string;
  @ApiProperty({ type: String, enum: ['OWNER', 'MEMBER', 'PUBLIC'] }) role!: string;
  @ApiProperty({ type: WorkspaceCreatorResponseDto }) createdBy!: WorkspaceCreatorResponseDto;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: Date;
}


export class ArchivedWorkspaceResponseDto extends WorkspaceResponseDto {
  @ApiProperty() declare archivedAt: Date;
}

export class InviteWorkspaceMemberRequestDto {
  @ApiProperty({ type: String, format: 'email' }) email!: string;
  @ApiPropertyOptional({ type: String, enum: ['MEMBER'], default: 'MEMBER' }) role?: string;
}

export class WorkspaceMemberResponseDto {
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiProperty({ type: String, format: 'uuid' }) userId!: string;
  @ApiProperty({ type: String }) displayName!: string;
  @ApiProperty({ type: String }) initials!: string;
  @ApiProperty({ type: String, nullable: true }) avatarUrl!: string | null;
  @ApiProperty({ type: String, enum: ['OWNER', 'MEMBER'] }) role!: string;
}

