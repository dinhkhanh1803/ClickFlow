import { afterEach, describe, expect, it, vi } from 'vitest';

import { attachmentApi } from './attachment-api';

afterEach(() => vi.unstubAllGlobals());

describe('attachmentApi', () => {
  it('uses signed multipart fields for Cloudinary uploads', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        storageKey: 'workspaces/workspace-1/attachments/file.mp4',
        uploadUrl: 'https://api.cloudinary.test/upload',
        uploadMethod: 'POST',
        uploadFields: { api_key: 'public-key', signature: 'signed', timestamp: '1' },
        expiresAt: '2026-07-19T00:10:00.000Z'
      }), { status: 201, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ public_id: 'file' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: 'attachment-1',
        taskId: 'task-1',
        fileName: 'demo.mp4',
        mimeType: 'video/mp4',
        byteSize: '8',
        createdAt: '2026-07-19T00:00:00.000Z'
      }), { status: 201, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const file = new File([Uint8Array.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d])], 'demo.mp4', { type: 'video/mp4' });

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
