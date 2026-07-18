import { ApiProperty } from '@nestjs/swagger';

export class UploadIntentRequestDto { @ApiProperty() taskId!: string; @ApiProperty() fileName!: string; @ApiProperty() mimeType!: string; @ApiProperty() byteSize!: number; }
export class CompleteAttachmentRequestDto extends UploadIntentRequestDto { @ApiProperty() storageKey!: string; @ApiProperty({ required: false }) checksum?: string; }
export class UploadIntentResponseDto { @ApiProperty() storageKey!: string; @ApiProperty() uploadUrl!: string; @ApiProperty() expiresAt!: Date; }
export class AttachmentResponseDto { @ApiProperty() id!: string; @ApiProperty() taskId!: string; @ApiProperty() fileName!: string; @ApiProperty() mimeType!: string; @ApiProperty() byteSize!: string; @ApiProperty() createdAt!: Date; }
export class DownloadUrlResponseDto { @ApiProperty() downloadUrl!: string; @ApiProperty() expiresAt!: Date; }
