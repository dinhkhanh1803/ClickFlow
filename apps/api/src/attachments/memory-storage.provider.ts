import { Injectable } from '@nestjs/common';

import type { StorageProvider, StoredObjectMetadata, UploadIntentSpec } from './storage-provider';

@Injectable()
export class MemoryStorageProvider implements StorageProvider {
  private readonly objects = new Map<string, StoredObjectMetadata>();

  createSignedUpload(spec: UploadIntentSpec) { return Promise.resolve( { uploadUrl: `memory://upload/${encodeURIComponent(spec.storageKey)}`, expiresAt: new Date(Date.now() + spec.expiresInSeconds * 1000) }); }
  createSignedDownload(storageKey: string, expiresInSeconds: number) { return Promise.resolve( { downloadUrl: `memory://download/${encodeURIComponent(storageKey)}`, expiresAt: new Date(Date.now() + expiresInSeconds * 1000) }); }
  head(storageKey: string) { return Promise.resolve(this.objects.get(storageKey) ?? null); }
  list(prefix: string) { return Promise.resolve([...this.objects.keys()].filter((key) => key.startsWith(prefix))); }
  delete(storageKey: string) { this.objects.delete(storageKey); return Promise.resolve(); }

  putObject(metadata: StoredObjectMetadata): void { this.objects.set(metadata.storageKey, metadata); }
  clear(): void { this.objects.clear(); }
}
