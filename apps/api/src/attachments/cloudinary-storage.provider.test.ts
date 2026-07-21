import { v2 as cloudinary } from 'cloudinary';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CloudinaryStorageProvider, cloudinaryAssetCoordinates, createCloudinaryUploadIntent } from './cloudinary-storage.provider';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Cloudinary storage provider', () => {
  it('creates a signed multipart upload without exposing the API secret', () => {
    const intent = createCloudinaryUploadIntent({
      storageKey: 'workspaces/workspace-1/attachments/file-1.png',
      mimeType: 'image/png',
      byteSize: 8,
      expiresInSeconds: 600
    }, {
      cloudName: 'clickflow',
      apiKey: 'public-key',
      apiSecret: 'private-secret'
    }, new Date('2026-07-19T00:00:00.000Z'));

    expect(intent).toMatchObject({
      uploadUrl: 'https://api.cloudinary.com/v1_1/clickflow/image/upload',
      uploadMethod: 'POST',
      uploadFields: {
        api_key: 'public-key',
        public_id: 'workspaces/workspace-1/attachments/file-1',
        type: 'private',
        context: 'mime_type=image/png',
        overwrite: 'false'
      },
      expiresAt: new Date('2026-07-19T00:10:00.000Z')
    });
    expect(intent.uploadFields.signature).toMatch(/^[a-f0-9]{40}$/);
    expect(intent.uploadFields).not.toHaveProperty('resource_type');
    expect(Object.values(intent.uploadFields)).not.toContain('private-secret');
  });

  it('routes videos and raw files to matching Cloudinary resource types', () => {
    const videoIntent = createCloudinaryUploadIntent({
      storageKey: 'workspaces/workspace-1/attachments/file-2.mp4',
      mimeType: 'video/mp4',
      byteSize: 12,
      expiresInSeconds: 600
    }, { cloudName: 'clickflow', apiKey: 'public-key', apiSecret: 'private-secret' }, new Date('2026-07-19T00:00:00.000Z'));
    const rawIntent = createCloudinaryUploadIntent({
      storageKey: 'workspaces/workspace-1/attachments/file-3.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      byteSize: 12,
      expiresInSeconds: 600
    }, { cloudName: 'clickflow', apiKey: 'public-key', apiSecret: 'private-secret' }, new Date('2026-07-19T00:00:00.000Z'));

    expect(videoIntent.uploadUrl).toBe('https://api.cloudinary.com/v1_1/clickflow/video/upload');
    expect(videoIntent.uploadFields.public_id).toBe('workspaces/workspace-1/attachments/file-2');
    expect(videoIntent.uploadFields).not.toHaveProperty('resource_type');
    expect(rawIntent.uploadUrl).toBe('https://api.cloudinary.com/v1_1/clickflow/raw/upload');
    expect(rawIntent.uploadFields.public_id).toBe('workspaces/workspace-1/attachments/file-3.docx');
    expect(rawIntent.uploadFields).not.toHaveProperty('resource_type');
  });

  it('maps a storage key to a Cloudinary public ID and format', () => {
    expect(cloudinaryAssetCoordinates('workspaces/a/attachments/file.pdf')).toEqual({
      publicId: 'workspaces/a/attachments/file.pdf',
      format: 'pdf',
      resourceType: 'raw'
    });
    expect(cloudinaryAssetCoordinates('workspaces/a/attachments/notes.md')).toEqual({
      publicId: 'workspaces/a/attachments/notes.md',
      format: 'md',
      resourceType: 'raw'
    });
    expect(cloudinaryAssetCoordinates('workspaces/a/attachments/clip.mp4')).toEqual({
      publicId: 'workspaces/a/attachments/clip',
      format: 'mp4',
      resourceType: 'video'
    });
    expect(() => cloudinaryAssetCoordinates('missing-extension')).toThrow('file extension');
  });

  it('reads uploaded image metadata without fetching the private asset bytes', async () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'clickflow';
    process.env.CLOUDINARY_API_KEY = 'public-key';
    process.env.CLOUDINARY_API_SECRET = 'private-secret';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(cloudinary.api, 'resource').mockResolvedValue({
      public_id: 'workspaces/workspace-1/attachments/file-1',
      format: 'png',
      bytes: 8,
      etag: 'checksum',
      context: { custom: { mime_type: 'image/png' } }
    });

    const metadata = await new CloudinaryStorageProvider().head('workspaces/workspace-1/attachments/file-1.png');

    expect(metadata).toEqual({
      storageKey: 'workspaces/workspace-1/attachments/file-1.png',
      mimeType: 'image/png',
      byteSize: 8,
      checksum: 'checksum'
    });
    expect(cloudinary.api.resource).toHaveBeenCalledWith('workspaces/workspace-1/attachments/file-1', { resource_type: 'image', type: 'private', context: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps raw file extensions in the Cloudinary public ID when reading metadata', async () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'clickflow';
    process.env.CLOUDINARY_API_KEY = 'public-key';
    process.env.CLOUDINARY_API_SECRET = 'private-secret';
    vi.spyOn(cloudinary.api, 'resource').mockResolvedValue({
      public_id: 'workspaces/workspace-1/attachments/notes.md',
      format: 'md',
      bytes: 7,
      etag: 'checksum',
      context: { custom: { mime_type: 'text/markdown' } }
    });

    const metadata = await new CloudinaryStorageProvider().head('workspaces/workspace-1/attachments/notes.md');

    expect(metadata?.mimeType).toBe('text/markdown');
    expect(cloudinary.api.resource).toHaveBeenCalledWith('workspaces/workspace-1/attachments/notes.md', { resource_type: 'raw', type: 'private', context: true });
  });
});