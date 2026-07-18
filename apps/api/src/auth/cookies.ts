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

function cookieOptions(httpOnly: boolean): CookieOptions {
  return {
    httpOnly,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth'
  };
}

export function writeAuthCookies(response: Response, refreshToken: string, csrfToken: string, refreshExpiresAt: Date): void {
  response.cookie(REFRESH_COOKIE, refreshToken, { ...cookieOptions(true), expires: refreshExpiresAt });
  response.cookie(CSRF_COOKIE, csrfToken, { ...cookieOptions(false), expires: refreshExpiresAt });
}

export function clearAuthCookies(response: Response): void {
  response.clearCookie(REFRESH_COOKIE, cookieOptions(true));
  response.clearCookie(CSRF_COOKIE, cookieOptions(false));
}
