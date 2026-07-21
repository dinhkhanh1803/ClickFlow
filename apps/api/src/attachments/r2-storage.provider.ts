import { Injectable } from '@nestjs/common';
import { createHmac, createHash } from 'node:crypto';

import type { StorageProvider, StoredObjectMetadata, UploadIntentSpec } from './storage-provider';

type R2Configuration = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

type R2SignedUrlInput = R2Configuration & {
  method: 'DELETE' | 'GET' | 'HEAD' | 'PUT';
  storageKey: string;
  expiresInSeconds: number;
  now?: Date;
  responseContentDisposition?: string;
  queryParameters?: Record<string, string>;
};

const region = 'auto';
const service = 's3';

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac('sha256', key).update(value).digest();
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function awsDate(now: Date): { shortDate: string; longDate: string } {
  const iso = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  return { shortDate: iso.slice(0, 8), longDate: iso };
}

function encodePathSegment(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

function canonicalQuery(parameters: Record<string, string>): string {
  return Object.entries(parameters)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)}`)
    .join('&');
}

function signingKey(secretAccessKey: string, shortDate: string): Buffer {
  return hmac(hmac(hmac(hmac(`AWS4${secretAccessKey}`, shortDate), region), service), 'aws4_request');
}

export function createR2SignedUrl(input: R2SignedUrlInput): string {
  const now = input.now ?? new Date();
  const { shortDate, longDate } = awsDate(now);
  const host = `${input.accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${encodePathSegment(input.bucket)}/${input.storageKey.split('/').map(encodePathSegment).join('/')}`;
  const credentialScope = `${shortDate}/${region}/${service}/aws4_request`;
  const parameters: Record<string, string> = { ...(input.queryParameters ?? {}),
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${input.accessKeyId}/${credentialScope}`,
    'X-Amz-Date': longDate,
    'X-Amz-Expires': String(input.expiresInSeconds),
    'X-Amz-SignedHeaders': 'host'
  };
  if (input.responseContentDisposition) parameters['response-content-disposition'] = input.responseContentDisposition;

  const query = canonicalQuery(parameters);
  const canonicalRequest = [
    input.method,
    canonicalUri,
    query,
    `host:${host}`,
    '',
    'host',
    'UNSIGNED-PAYLOAD'
  ].join('\n');
  const stringToSign = ['AWS4-HMAC-SHA256', longDate, credentialScope, hash(canonicalRequest)].join('\n');
  const signature = createHmac('sha256', signingKey(input.secretAccessKey, shortDate)).update(stringToSign).digest('hex');

  return `https://${host}${canonicalUri}?${query}&X-Amz-Signature=${signature}`;
}

@Injectable()
export class R2StorageProvider implements StorageProvider {
  private readonly configuration: R2Configuration;
  private readonly now?: Date;

  constructor(configuration?: Partial<R2Configuration>, now?: Date) {
    this.configuration = {
      accountId: configuration?.accountId ?? process.env.R2_ACCOUNT_ID ?? '',
      accessKeyId: configuration?.accessKeyId ?? process.env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: configuration?.secretAccessKey ?? process.env.R2_SECRET_ACCESS_KEY ?? '',
      bucket: configuration?.bucket ?? process.env.R2_BUCKET ?? ''
    };
    this.now = now;
  }

  isConfigured(): boolean {
    return Boolean(this.configuration.accountId && this.configuration.accessKeyId && this.configuration.secretAccessKey && this.configuration.bucket);
  }

  createSignedUpload(spec: UploadIntentSpec) {
    this.assertConfigured();
    const expiresAt = this.expiresAt(spec.expiresInSeconds);
    return Promise.resolve({
      uploadUrl: this.sign('PUT', spec.storageKey, spec.expiresInSeconds),
      uploadMethod: 'PUT' as const,
      uploadHeaders: { 'Content-Type': spec.mimeType },
      expiresAt
    });
  }

  createSignedDownload(storageKey: string, expiresInSeconds: number) {
    this.assertConfigured();
    return Promise.resolve({
      downloadUrl: this.sign('GET', storageKey, expiresInSeconds, 'attachment'),
      expiresAt: this.expiresAt(expiresInSeconds)
    });
  }

  async head(storageKey: string): Promise<StoredObjectMetadata | null> {
    this.assertConfigured();
    const response = await fetch(this.sign('HEAD', storageKey, 60), { method: 'HEAD' });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`R2 metadata lookup failed with status ${response.status}`);

    const byteSize = Number(response.headers.get('content-length') ?? 0);
    const mimeType = response.headers.get('content-type')?.split(';')[0]?.trim() || 'application/octet-stream';
    const etag = response.headers.get('etag')?.replace(/^"|"$/g, '');

    return {
      storageKey,
      mimeType,
      byteSize,
      ...(etag ? { checksum: etag } : {})
    };
  }

  async list(prefix: string): Promise<string[]> {
    this.assertConfigured();
    const response = await fetch(this.sign('GET', '', 60, undefined, { 'list-type': '2', prefix }), { method: 'GET' });
    if (!response.ok) throw new Error(`R2 list failed with status ${response.status}`);
    const text = await response.text();
    return [...text.matchAll(/<Key>([^<]+)<\/Key>/g)].map((match) => this.decodeXml(match[1] ?? ''));
  }

  async delete(storageKey: string): Promise<void> {
    this.assertConfigured();
    const response = await fetch(this.sign('DELETE', storageKey, 60), { method: 'DELETE' });
    if (!response.ok && response.status !== 404) throw new Error(`R2 delete failed with status ${response.status}`);
  }

  private sign(method: R2SignedUrlInput['method'], storageKey: string, expiresInSeconds: number, responseContentDisposition?: string, queryParameters?: Record<string, string>): string {
    return createR2SignedUrl({
      ...this.configuration,
      method,
      storageKey,
      expiresInSeconds,
      now: this.now,
      responseContentDisposition,
      queryParameters
    });
  }

  private expiresAt(expiresInSeconds: number): Date {
    return new Date((this.now?.getTime() ?? Date.now()) + expiresInSeconds * 1000);
  }

  private assertConfigured(): void {
    if (!this.isConfigured()) throw new Error('STORAGE_PROVIDER=r2 requires complete Cloudflare R2 credentials');
  }

  private decodeXml(value: string): string {
    return value
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  }
}
