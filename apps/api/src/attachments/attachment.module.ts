import { Module } from '@nestjs/common';
import { AttachmentController } from './attachment.controller';
import { AttachmentService } from './attachment.service';
import { MemoryStorageProvider } from './memory-storage.provider';
import { STORAGE_PROVIDER } from './storage-provider';
@Module({ controllers: [AttachmentController], providers: [AttachmentService, MemoryStorageProvider, { provide: STORAGE_PROVIDER, useExisting: MemoryStorageProvider }], exports: [AttachmentService, MemoryStorageProvider, STORAGE_PROVIDER] })
export class AttachmentModule {}
