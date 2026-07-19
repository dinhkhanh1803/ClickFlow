import { Module } from '@nestjs/common';
import { AttachmentController } from './attachment.controller';
import { CloudinaryStorageProvider } from './cloudinary-storage.provider';
import { AttachmentService } from './attachment.service';
import { MemoryStorageProvider } from './memory-storage.provider';
import { STORAGE_PROVIDER } from './storage-provider';
@Module({
  controllers: [AttachmentController],
  providers: [
    AttachmentService,
    MemoryStorageProvider,
    CloudinaryStorageProvider,
    {
      provide: STORAGE_PROVIDER,
      inject: [MemoryStorageProvider, CloudinaryStorageProvider],
      useFactory: (memory: MemoryStorageProvider, cloudinary: CloudinaryStorageProvider) => {
        if (process.env.NODE_ENV === 'test' || process.env.STORAGE_PROVIDER !== 'cloudinary') return memory;
        if (!cloudinary.isConfigured()) throw new Error('STORAGE_PROVIDER=cloudinary requires complete Cloudinary credentials');
        return cloudinary;
      }
    }
  ],
  exports: [AttachmentService, MemoryStorageProvider, CloudinaryStorageProvider, STORAGE_PROVIDER]
})
export class AttachmentModule {}
