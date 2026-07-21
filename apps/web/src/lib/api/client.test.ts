import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApiClient } from './client';

afterEach(() => vi.unstubAllGlobals());

describe('API client', () => {
  it('sends JSON with credentials and an access token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    }));
    vi.stubGlobal('fetch', fetchMock);

    const client = createApiClient('http://localhost:3001/api/v1/');
    await client.post('/example', { value: 1 }, { accessToken: 'access-token' });

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/api/v1/example', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ value: 1 }),
      headers: expect.objectContaining({
        Authorization: 'Bearer access-token',
        'Content-Type': 'application/json'
      })
    }));
  });

  it('throws the standard API error envelope', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      code: 'UNAUTHORIZED',
      message: 'Invalid email or password',
      requestId: 'request-1'
    }), { status: 401, headers: { 'content-type': 'application/json' } })));

    const client = createApiClient('http://localhost:3001/api/v1');
    await expect(client.post('/auth/login', {})).rejects.toEqual(expect.objectContaining({
      name: 'ApiError',
      status: 401,
      code: 'UNAUTHORIZED',
      requestId: 'request-1'
    }));
  });
});
