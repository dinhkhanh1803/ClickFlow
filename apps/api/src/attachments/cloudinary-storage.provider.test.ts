import { describe, expect, it } from 'vitest';

import { cloudinaryAssetCoordinates, createCloudinaryUploadIntent } from './cloudinary-storage.provider';

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
    expect(videoIntent.uploadFields.resource_type).toBe('video');
    expect(rawIntent.uploadUrl).toBe('https://api.cloudinary.com/v1_1/clickflow/raw/upload');
    expect(rawIntent.uploadFields.resource_type).toBe('raw');
  });
  it('maps a storage key to a Cloudinary public ID and format', () => {
    expect(cloudinaryAssetCoordinates('workspaces/a/attachments/file.pdf')).toEqual({
      publicId: 'workspaces/a/attachments/file',
      format: 'pdf',
      resourceType: 'raw'
    });
    expect(() => cloudinaryAssetCoordinates('missing-extension')).toThrow('file extension');
  });
});
