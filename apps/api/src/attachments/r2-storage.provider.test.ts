import { afterEach, describe, expect, it, vi } from 'vitest';

import { createR2SignedUrl, R2StorageProvider } from './r2-storage.provider';

const configuration = {
  accountId: 'account-123',
  accessKeyId: 'access-key',
  secretAccessKey: 'secret-key',
  bucket: 'clickflow-attachments'
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('R2 storage provider', () => {
  it('creates a signed PUT upload URL without exposing the secret access key', async () => {
    const intent = await new R2StorageProvider(configuration, new Date('2026-07-21T00:00:00.000Z')).createSignedUpload({
      storageKey: 'workspaces/workspace-1/attachments/file-1.png',
      mimeType: 'image/png',
      byteSize: 8,
      expiresInSeconds: 600
    });

    expect(intent).toMatchObject({
      uploadMethod: 'PUT',
      uploadHeaders: { 'Content-Type': 'image/png' },
      expiresAt: new Date('2026-07-21T00:10:00.000Z')
    });
    const url = new URL(intent.uploadUrl);
    expect(url.origin).toBe('https://account-123.r2.cloudflarestorage.com');
    expect(url.pathname).toBe('/clickflow-attachments/workspaces/workspace-1/attachments/file-1.png');
    expect(url.searchParams.get('X-Amz-Algorithm')).toBe('AWS4-HMAC-SHA256');
    expect(url.searchParams.get('X-Amz-Credential')).toContain('access-key/20260721/auto/s3/aws4_request');
    expect(url.searchParams.get('X-Amz-Expires')).toBe('600');
    expect(intent.uploadUrl).not.toContain('secret-key');
  });

  it('creates short-lived signed download URLs', async () => {
    const { downloadUrl, expiresAt } = await new R2StorageProvider(configuration, new Date('2026-07-21T00:00:00.000Z'))
      .createSignedDownload('workspaces/workspace-1/attachments/file-1.pdf', 300);

    const url = new URL(downloadUrl);
    expect(url.pathname).toBe('/clickflow-attachments/workspaces/workspace-1/attachments/file-1.pdf');
    expect(url.searchParams.get('X-Amz-Expires')).toBe('300');
    expect(expiresAt).toEqual(new Date('2026-07-21T00:05:00.000Z'));
    expect(downloadUrl).not.toContain('secret-key');
  });

  it('reads object metadata through a signed HEAD request', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({
        'content-type': 'text/markdown',
        'content-length': '12',
        etag: '"checksum"'
      })
    });
    vi.stubGlobal('fetch', fetchMock);

    const metadata = await new R2StorageProvider(configuration, new Date('2026-07-21T00:00:00.000Z'))
      .head('workspaces/workspace-1/attachments/notes.md');

    expect(metadata).toEqual({
      storageKey: 'workspaces/workspace-1/attachments/notes.md',
      mimeType: 'text/markdown',
      byteSize: 12,
      checksum: 'checksum'
    });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/clickflow-attachments/workspaces/workspace-1/attachments/notes.md?'), { method: 'HEAD' });
  });

  it('returns null when R2 reports a missing object', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    await expect(new R2StorageProvider(configuration, new Date('2026-07-21T00:00:00.000Z'))
      .head('workspaces/workspace-1/attachments/missing.md')).resolves.toBeNull();
  });


  it('lists keys by signing the list query params', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<ListBucketResult><Contents><Key>workspaces/a/attachments/one.md</Key></Contents><Contents><Key>workspaces/a/attachments/two.png</Key></Contents></ListBucketResult>')
    });
    vi.stubGlobal('fetch', fetchMock);

    const keys = await new R2StorageProvider(configuration, new Date('2026-07-21T00:00:00.000Z'))
      .list('workspaces/a/attachments/');

    const requestUrl = new URL(fetchMock.mock.calls[0]?.[0] as string);
    expect(keys).toEqual(['workspaces/a/attachments/one.md', 'workspaces/a/attachments/two.png']);
    expect(requestUrl.searchParams.get('list-type')).toBe('2');
    expect(requestUrl.searchParams.get('prefix')).toBe('workspaces/a/attachments/');
    expect(requestUrl.searchParams.get('X-Amz-Signature')).toMatch(/^[a-f0-9]{64}$/);
  });
  it('signs canonical query params deterministically', () => {
    const url = createR2SignedUrl({
      ...configuration,
      method: 'GET',
      storageKey: 'workspaces/workspace-1/attachments/a b.md',
      expiresInSeconds: 300,
      now: new Date('2026-07-21T00:00:00.000Z')
    });

    expect(url).toContain('/clickflow-attachments/workspaces/workspace-1/attachments/a%20b.md');
    expect(new URL(url).searchParams.get('X-Amz-Signature')).toMatch(/^[a-f0-9]{64}$/);
  });
});
