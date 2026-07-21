import { afterEach, describe, expect, it, vi } from 'vitest';

import { attachmentApi } from './attachment-api';

afterEach(() => vi.unstubAllGlobals());

function mockSuccessfulUploadIntent(fetchMock: ReturnType<typeof vi.fn>, storageKey = 'workspaces/workspace-1/attachments/file.mp4') {
  fetchMock
    .mockResolvedValueOnce(new Response(JSON.stringify({
      storageKey,
      uploadUrl: 'https://api.cloudinary.test/upload',
      uploadMethod: 'POST',
      uploadFields: { api_key: 'public-key', signature: 'signed', timestamp: '1' },
      expiresAt: '2026-07-19T00:10:00.000Z'
    }), { status: 201, headers: { 'content-type': 'application/json' } }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ public_id: 'file' }), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({
      id: 'attachment-1',
      taskId: 'task-1',
      fileName: 'uploaded-file',
      mimeType: 'application/octet-stream',
      byteSize: '8',
      createdAt: '2026-07-19T00:00:00.000Z'
    }), { status: 201, headers: { 'content-type': 'application/json' } }));
}

describe('attachmentApi', () => {
  it('uses signed multipart fields for Cloudinary uploads', async () => {
    const fetchMock = vi.fn();
    mockSuccessfulUploadIntent(fetchMock);
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

  it('infers MIME type from the file extension when the browser does not provide one', async () => {
    const fetchMock = vi.fn();
    mockSuccessfulUploadIntent(fetchMock, 'workspaces/workspace-1/attachments/file.png');
    vi.stubGlobal('fetch', fetchMock);
    const file = new File([Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'photo.png');

    await attachmentApi.upload('token', 'workspace-1', 'task-1', file);

    const request = JSON.parse(String(fetchMock.mock.calls[0]![1]!.body));
    expect(request.mimeType).toBe('image/png');
  });

  it('normalizes generic browser MIME types for Office documents from the extension', async () => {
    const fetchMock = vi.fn();
    mockSuccessfulUploadIntent(fetchMock, 'workspaces/workspace-1/attachments/file.docx');
    vi.stubGlobal('fetch', fetchMock);
    const file = new File([Uint8Array.from([0x50, 0x4b, 0x03, 0x04])], 'report.docx', { type: 'application/octet-stream' });

    await attachmentApi.upload('token', 'workspace-1', 'task-1', file);

    const request = JSON.parse(String(fetchMock.mock.calls[0]![1]!.body));
    expect(request.mimeType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  });
  it('normalizes Markdown files from the md extension', async () => {
    const fetchMock = vi.fn();
    mockSuccessfulUploadIntent(fetchMock, 'workspaces/workspace-1/attachments/file.md');
    vi.stubGlobal('fetch', fetchMock);
    const file = new File(['# Notes'], 'notes.md', { type: 'application/octet-stream' });

    await attachmentApi.upload('token', 'workspace-1', 'task-1', file);

    const request = JSON.parse(String(fetchMock.mock.calls[0]![1]!.body));
    expect(request.mimeType).toBe('text/markdown');
  });
});
