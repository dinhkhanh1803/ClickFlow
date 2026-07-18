import { ApiProperty } from '@nestjs/swagger';
export class CreateTemplateRequestDto { @ApiProperty({ type: String }) sourceProjectId!: string; @ApiProperty({ type: String }) name!: string; @ApiProperty({ required: false, type: String }) description?: string; }
export class InstantiateTemplateRequestDto { @ApiProperty({ required: false, type: String }) name?: string; }
export class TemplateResponseDto { @ApiProperty({ type: String }) id!: string; @ApiProperty({ type: String }) name!: string; @ApiProperty({ type: String }) description!: string | null; @ApiProperty({ type: String }) sourceProjectId!: string | null; @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date; }
export class ArchiveResponseDto { @ApiProperty({ type: [Object] }) projects!: object[]; @ApiProperty({ type: [Object] }) tasks!: object[]; @ApiProperty({ type: [Object] }) templates!: object[]; }
export class UpdateSettingsRequestDto { @ApiProperty({ required: false, type: String }) timezone?: string; @ApiProperty({ required: false, type: String }) locale?: string; @ApiProperty({ required: false, type: Object }) preferences?: object; }
export class SettingsResponseDto { @ApiProperty({ type: String }) timezone!: string; @ApiProperty({ type: String }) locale!: string; @ApiProperty({ type: Object }) preferences!: object; }
