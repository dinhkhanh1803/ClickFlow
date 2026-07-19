const DEFAULT_API_BASE_URL = 'http://localhost:3001/api/v1';

export function resolveApiBaseUrl(value = process.env.NEXT_PUBLIC_API_URL): string {
  const candidate = value?.trim() || DEFAULT_API_BASE_URL;
  const url = new URL(candidate);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('NEXT_PUBLIC_API_URL must use http or https');
  }
  return url.toString().replace(/\/$/, '');
}

export const apiBaseUrl = resolveApiBaseUrl();
