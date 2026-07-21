import { Module } from '@nestjs/common';
import { ArchiveSettingsService } from './archive-settings.service';
import { ArchiveSettingsController, TemplateController } from './productivity.controller';
import { TemplateService } from './template.service';
@Module({ controllers: [TemplateController, ArchiveSettingsController], providers: [TemplateService, ArchiveSettingsService] })
export class ProductivityModule {}
