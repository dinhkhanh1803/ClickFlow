import { Module } from '@nestjs/common';
import { AttachmentController } from './attachment.controller';
import { CloudinaryStorageProvider } from './cloudinary-storage.provider';
import { AttachmentService } from './attachment.service';
import { MemoryStorageProvider } from './memory-storage.provider';
import { R2StorageProvider } from './r2-storage.provider';
import { STORAGE_PROVIDER } from './storage-provider';
@Module({
  controllers: [AttachmentController],
  providers: [
    AttachmentService,
    MemoryStorageProvider,
    CloudinaryStorageProvider,
    R2StorageProvider,
    {
      provide: STORAGE_PROVIDER,
      inject: [MemoryStorageProvider, CloudinaryStorageProvider, R2StorageProvider],
      useFactory: (memory: MemoryStorageProvider, cloudinary: CloudinaryStorageProvider, r2: R2StorageProvider) => {
        if (process.env.NODE_ENV === 'test') return memory;
        if (process.env.STORAGE_PROVIDER === 'r2') {
          if (!r2.isConfigured()) throw new Error('STORAGE_PROVIDER=r2 requires complete Cloudflare R2 credentials');
          return r2;
        }
        if (process.env.STORAGE_PROVIDER !== 'cloudinary') return memory;
        if (!cloudinary.isConfigured()) throw new Error('STORAGE_PROVIDER=cloudinary requires complete Cloudinary credentials');
        return cloudinary;
      }
    }
  ],
  exports: [AttachmentService, MemoryStorageProvider, CloudinaryStorageProvider, R2StorageProvider, STORAGE_PROVIDER]
})
export class AttachmentModule {}
