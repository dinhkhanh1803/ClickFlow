import { CSRF_COOKIE, REFRESH_COOKIE, clearAuthCookies, writeAuthCookies } from './cookies';

describe('auth cookies', () => {
  it('keeps the refresh token auth-scoped and exposes CSRF at the frontend path', () => {
    const response = { cookie: vi.fn(), clearCookie: vi.fn() };
    const expiresAt = new Date('2026-07-20T00:00:00.000Z');

    writeAuthCookies(response as never, 'refresh-token', 'csrf-token', expiresAt);
    expect(response.cookie).toHaveBeenCalledWith(REFRESH_COOKIE, 'refresh-token', expect.objectContaining({
      httpOnly: true,
      path: '/api/v1/auth'
    }));
    expect(response.cookie).toHaveBeenCalledWith(CSRF_COOKIE, 'csrf-token', expect.objectContaining({
      httpOnly: false,
      path: '/'
    }));

    clearAuthCookies(response as never);
    expect(response.clearCookie).toHaveBeenCalledWith(REFRESH_COOKIE, expect.objectContaining({ path: '/api/v1/auth' }));
    expect(response.clearCookie).toHaveBeenCalledWith(CSRF_COOKIE, expect.objectContaining({ path: '/' }));
  });
});
