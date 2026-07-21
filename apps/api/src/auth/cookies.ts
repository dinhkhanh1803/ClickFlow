import type { CookieOptions, Response } from 'express';

export const REFRESH_COOKIE = 'clickflow_refresh';
export const CSRF_COOKIE = 'clickflow_csrf';

export function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(header.split(';').flatMap((part) => {
    const separator = part.indexOf('=');
    if (separator < 1) return [];
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    try {
      return [[key, decodeURIComponent(value)]];
    } catch {
      return [];
    }
  }));
}

function sharedCookieOptions(): Pick<CookieOptions, 'secure' | 'sameSite'> {
  return {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };
}

function refreshCookieOptions(): CookieOptions {
  return { ...sharedCookieOptions(), httpOnly: true, path: '/api/v1/auth' };
}

function csrfCookieOptions(): CookieOptions {
  return { ...sharedCookieOptions(), httpOnly: false, path: '/' };
}

export function writeAuthCookies(response: Response, refreshToken: string, csrfToken: string, refreshExpiresAt: Date): void {
  response.cookie(REFRESH_COOKIE, refreshToken, { ...refreshCookieOptions(), expires: refreshExpiresAt });
  response.cookie(CSRF_COOKIE, csrfToken, { ...csrfCookieOptions(), expires: refreshExpiresAt });
}

export function clearAuthCookies(response: Response): void {
  response.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
  response.clearCookie(CSRF_COOKIE, csrfCookieOptions());
}
