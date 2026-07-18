import { redactSensitive } from './redaction';

describe('redactSensitive', () => {
  it('redacts credentials, auth headers and sensitive PII recursively', () => {
    expect(redactSensitive({
      email: 'owner@clickflow.local',
      nested: {
        password: 'plain-text',
        accessToken: 'token-value',
        authorization: 'Bearer secret',
        cookie: 'refresh=secret',
        phone: '+84000000000',
        ip_address: '127.0.0.1',
        api_key: 'provider-key',
        safe: 'visible'
      }
    })).toEqual({
      email: '[REDACTED]',
      nested: {
        password: '[REDACTED]',
        accessToken: '[REDACTED]',
        authorization: '[REDACTED]',
        cookie: '[REDACTED]',
        phone: '[REDACTED]',
        ip_address: '[REDACTED]',
        api_key: '[REDACTED]',
        safe: 'visible'
      }
    });
  });

  it('handles arrays and circular values without leaking data', () => {
    const value: Record<string, unknown> = { items: [{ refreshToken: 'secret' }] };
    value.self = value;
    expect(redactSensitive(value)).toEqual({ items: [{ refreshToken: '[REDACTED]' }], self: '[CIRCULAR]' });
  });
});
