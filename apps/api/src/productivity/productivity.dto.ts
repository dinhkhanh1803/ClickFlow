import { ApiProperty } from '@nestjs/swagger';
export class CreateTemplateRequestDto { @ApiProperty() sourceProjectId!: string; @ApiProperty() name!: string; @ApiProperty({ required: false }) description?: string; }
export class InstantiateTemplateRequestDto { @ApiProperty({ required: false }) name?: string; }
export class TemplateResponseDto { @ApiProperty() id!: string; @ApiProperty() name!: string; @ApiProperty() description!: string | null; @ApiProperty() sourceProjectId!: string | null; @ApiProperty() createdAt!: Date; }
export class ArchiveResponseDto { @ApiProperty({ type: [Object] }) projects!: object[]; @ApiProperty({ type: [Object] }) tasks!: object[]; @ApiProperty({ type: [Object] }) templates!: object[]; }
export class UpdateSettingsRequestDto { @ApiProperty({ required: false }) timezone?: string; @ApiProperty({ required: false }) locale?: string; @ApiProperty({ required: false, type: Object }) preferences?: object; }
export class SettingsResponseDto { @ApiProperty() timezone!: string; @ApiProperty() locale!: string; @ApiProperty({ type: Object }) preferences!: object; }
