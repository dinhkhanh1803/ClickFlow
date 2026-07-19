import { afterEach, describe, expect, it, vi } from 'vitest';

import { authApi } from './auth-api';

afterEach(() => vi.unstubAllGlobals());

describe('authApi', () => {
  it('uses the cookie-backed login endpoint', async () => {
    const response = {
      accessToken: 'access-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      csrfToken: 'csrf-token',
      user: {
        id: '10000000-0000-4000-8000-000000000001',
        email: 'owner@clickflow.local',
        displayName: 'ClickFlow Owner',
        avatarUrl: null,
        timezone: 'UTC',
        locale: 'en'
      }
    };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(authApi.login({ email: 'owner@clickflow.local', password: 'password-123' })).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/auth\/login$/), expect.objectContaining({
      credentials: 'include',
      method: 'POST'
    }));
  });
  it('posts the Google credential to the cookie-backed auth endpoint', async () => {
    const response = {
      accessToken: 'access-token', tokenType: 'Bearer', expiresIn: 900, csrfToken: 'csrf-token',
      user: { id: 'user-1', email: 'person@gmail.com', displayName: 'Google Person', avatarUrl: null, timezone: 'UTC', locale: 'en' }
    };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(response), {
      status: 200, headers: { 'content-type': 'application/json' }
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(authApi.googleLogin({ credential: 'google-id-token' })).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/auth\/google$/), expect.objectContaining({
      credentials: 'include', method: 'POST', body: JSON.stringify({ credential: 'google-id-token' })
    }));
  });
});
