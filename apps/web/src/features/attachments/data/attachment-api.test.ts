import { afterEach, describe, expect, it, vi } from 'vitest';

import { attachmentApi } from './attachment-api';

afterEach(() => vi.unstubAllGlobals());

describe('attachmentApi', () => {
  it('uses signed multipart fields for Cloudinary uploads', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        storageKey: 'workspaces/workspace-1/attachments/file.png',
        uploadUrl: 'https://api.cloudinary.test/upload',
        uploadMethod: 'POST',
        uploadFields: { api_key: 'public-key', signature: 'signed', timestamp: '1' },
        expiresAt: '2026-07-19T00:10:00.000Z'
      }), { status: 201, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ public_id: 'file' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: 'attachment-1',
        taskId: 'task-1',
        fileName: 'image.png',
        mimeType: 'image/png',
        byteSize: '8',
        createdAt: '2026-07-19T00:00:00.000Z'
      }), { status: 201, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const file = new File([Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'image.png', { type: 'image/png' });

    await attachmentApi.upload('token', 'workspace-1', 'task-1', file);

    const uploadOptions = fetchMock.mock.calls[1]![1] as RequestInit;
    expect(fetchMock.mock.calls[1]![0]).toBe('https://api.cloudinary.test/upload');
    expect(uploadOptions.method).toBe('POST');
    expect(uploadOptions.body).toBeInstanceOf(FormData);
    const form = uploadOptions.body as FormData;
    expect(form.get('api_key')).toBe('public-key');
    expect(form.get('signature')).toBe('signed');
    expect(form.get('file')).toBe(file);
  });
});
