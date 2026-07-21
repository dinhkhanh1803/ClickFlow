import { describe, expect, it } from 'vitest';
import { loadEnvironment, parseCorsOrigins } from './environment';

describe('environment', () => {
  it('fails fast when production secrets are absent', () => {
    expect(() => loadEnvironment({
      NODE_ENV: 'production',
      CORS_ORIGIN: 'https://clickflow.example',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/clickflow'
    })).toThrow('JWT_ACCESS_SECRET');
  });

  it('requires PostgreSQL in staging and production', () => {
    expect(() => loadEnvironment({ NODE_ENV: 'staging' })).toThrow('DATABASE_URL');
  });

  it('allows database-free unit tests and keeps public account creation disabled by default', () => {
    const environment = loadEnvironment({ NODE_ENV: 'test' });
    expect(environment.DATABASE_URL).toBeUndefined();
    expect(environment.PUBLIC_REGISTRATION_ENABLED).toBe('false');
    expect(environment.GOOGLE_LOGIN_ENABLED).toBe('false');
  });

  it('parses an explicit CORS allowlist', () => {
    expect(parseCorsOrigins('https://one.example, https://two.example')).toEqual(['https://one.example', 'https://two.example']);
  });

  it('requires credentials when Cloudinary storage is selected', () => {
    expect(() => loadEnvironment({ NODE_ENV: 'test', STORAGE_PROVIDER: 'cloudinary' })).toThrow('CLOUDINARY_CLOUD_NAME');
  });
  it('requires credentials when Cloudflare R2 storage is selected', () => {
    expect(() => loadEnvironment({ NODE_ENV: 'test', STORAGE_PROVIDER: 'r2' })).toThrow('R2_ACCOUNT_ID');
  });
});
