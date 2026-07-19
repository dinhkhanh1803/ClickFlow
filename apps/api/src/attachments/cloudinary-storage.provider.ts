import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

import type { StorageProvider, StoredObjectMetadata, UploadIntentSpec } from './storage-provider';

type CloudinaryConfiguration = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

type CloudinaryResource = {
  public_id: string;
  format: string;
  bytes: number;
  etag?: string;
  context?: { custom?: { mime_type?: string } };
};

type CloudinaryResourcePage = {
  resources: CloudinaryResource[];
  next_cursor?: string;
};

export function cloudinaryAssetCoordinates(storageKey: string): { publicId: string; format: string } {
  const match = storageKey.match(/^(.+)\.([a-z0-9]+)$/i);
  if (!match) throw new Error('Cloudinary storage keys must include a file extension');
  return { publicId: match[1]!, format: match[2]!.toLowerCase() };
}

export function createCloudinaryUploadIntent(
  spec: UploadIntentSpec,
  configuration: CloudinaryConfiguration,
  now = new Date()
) {
  const timestamp = Math.floor(now.getTime() / 1000);
  const expiresAt = new Date(now.getTime() + spec.expiresInSeconds * 1000);
  const { publicId } = cloudinaryAssetCoordinates(spec.storageKey);
  const context = `mime_type=${spec.mimeType}`;
  const parameters = { context, overwrite: false, public_id: publicId, timestamp, type: 'private' };
  const signature = cloudinary.utils.api_sign_request(parameters, configuration.apiSecret);

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${configuration.cloudName}/image/upload`,
    uploadMethod: 'POST' as const,
    uploadFields: {
      api_key: configuration.apiKey,
      context,
      overwrite: 'false',
      public_id: publicId,
      signature,
      timestamp: String(timestamp),
      type: 'private'
    },
    expiresAt
  };
}

@Injectable()
export class CloudinaryStorageProvider implements StorageProvider {
  private readonly configuration: CloudinaryConfiguration;

  constructor() {
    this.configuration = {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
      apiKey: process.env.CLOUDINARY_API_KEY ?? '',
      apiSecret: process.env.CLOUDINARY_API_SECRET ?? ''
    };
    if (this.isConfigured()) {
      cloudinary.config({
        cloud_name: this.configuration.cloudName,
        api_key: this.configuration.apiKey,
        api_secret: this.configuration.apiSecret,
        secure: true
      });
    }
  }

  isConfigured(): boolean {
    return Boolean(this.configuration.cloudName && this.configuration.apiKey && this.configuration.apiSecret);
  }

  createSignedUpload(spec: UploadIntentSpec) {
    this.assertConfigured();
    return Promise.resolve(createCloudinaryUploadIntent(spec, this.configuration));
  }

  createSignedDownload(storageKey: string, expiresInSeconds: number) {
    this.assertConfigured();
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    const { publicId, format } = cloudinaryAssetCoordinates(storageKey);
    const downloadUrl = cloudinary.utils.private_download_url(publicId, format, {
      resource_type: 'image',
      type: 'private',
      expires_at: Math.floor(expiresAt.getTime() / 1000),
      attachment: true
    });
    return Promise.resolve({ downloadUrl, expiresAt });
  }

  async head(storageKey: string): Promise<StoredObjectMetadata | null> {
    this.assertConfigured();
    const { publicId, format } = cloudinaryAssetCoordinates(storageKey);
    let resource: CloudinaryResource;
    try {
      resource = await cloudinary.api.resource(publicId, {
        resource_type: 'image',
        type: 'private'
      }) as unknown as CloudinaryResource;
    } catch (error) {
      if (this.isNotFound(error)) return null;
      throw error;
    }

    const probeUrl = cloudinary.utils.private_download_url(publicId, format, {
      resource_type: 'image',
      type: 'private',
      expires_at: Math.floor(Date.now() / 1000) + 60
    });
    const response = await fetch(probeUrl);
    if (!response.ok) throw new Error(`Cloudinary asset verification failed with HTTP ${response.status}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const mimeType = resource.context?.custom?.mime_type ?? this.mimeTypeForFormat(resource.format);

    return {
      storageKey,
      mimeType,
      byteSize: resource.bytes,
      bytes,
      checksum: resource.etag
    };
  }

  async list(prefix: string): Promise<string[]> {
    this.assertConfigured();
    const keys: string[] = [];
    let nextCursor: string | undefined;
    do {
      const page = await cloudinary.api.resources({
        resource_type: 'image',
        type: 'private',
        prefix: prefix.replace(/\.[^.]+$/, ''),
        max_results: 500,
        ...(nextCursor ? { next_cursor: nextCursor } : {})
      }) as unknown as CloudinaryResourcePage;
      keys.push(...page.resources.map((resource) => `${resource.public_id}.${resource.format}`));
      nextCursor = page.next_cursor;
    } while (nextCursor);
    return keys;
  }

  async delete(storageKey: string): Promise<void> {
    this.assertConfigured();
    const { publicId } = cloudinaryAssetCoordinates(storageKey);
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
      type: 'private',
      invalidate: true
    });
  }

  private assertConfigured(): void {
    if (!this.isConfigured()) throw new Error('Cloudinary storage is selected but its credentials are incomplete');
  }

  private isNotFound(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'http_code' in error && error.http_code === 404;
  }

  private mimeTypeForFormat(format: string): string {
    if (format === 'jpg' || format === 'jpeg') return 'image/jpeg';
    if (format === 'png') return 'image/png';
    if (format === 'pdf') return 'application/pdf';
    return 'application/octet-stream';
  }
}
