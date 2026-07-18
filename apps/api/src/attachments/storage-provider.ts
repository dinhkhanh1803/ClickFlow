export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

export interface UploadIntentSpec {
  storageKey: string;
  mimeType: string;
  byteSize: number;
  expiresInSeconds: number;
}

export interface StoredObjectMetadata {
  storageKey: string;
  mimeType: string;
  byteSize: number;
  bytes: Uint8Array;
  checksum?: string;
}

export interface StorageProvider {
  createSignedUpload(spec: UploadIntentSpec): Promise<{ uploadUrl: string; expiresAt: Date }>;
  createSignedDownload(storageKey: string, expiresInSeconds: number): Promise<{ downloadUrl: string; expiresAt: Date }>;
  head(storageKey: string): Promise<StoredObjectMetadata | null>;
  list(prefix: string): Promise<string[]>;
  delete(storageKey: string): Promise<void>;
}
