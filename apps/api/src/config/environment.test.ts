import { describe, expect, it } from 'vitest';
import { loadEnvironment, parseCorsOrigins } from './environment';

describe('environment', () => {
  it('fails fast when production secrets are absent', () => {
    expect(() => loadEnvironment({ NODE_ENV: 'production', CORS_ORIGIN: 'https://clickflow.example' })).toThrow('JWT_ACCESS_SECRET');
  });

  it('parses an explicit CORS allowlist', () => {
    expect(parseCorsOrigins('https://one.example, https://two.example')).toEqual(['https://one.example', 'https://two.example']);
  });
});
