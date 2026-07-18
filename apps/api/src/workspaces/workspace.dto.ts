import { ApiProperty } from '@nestjs/swagger';

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
