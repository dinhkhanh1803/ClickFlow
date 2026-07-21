import { decideRefreshRotation, validateResetTokenState } from './session-lifecycle';

describe('session lifecycle rules', () => {
  const now = new Date('2026-01-01T00:00:00Z');

  it('detects refresh reuse before expiry checks', () => {
    expect(decideRefreshRotation({ revokedAt: new Date('2025-12-31T23:59:00Z'), expiresAt: new Date('2026-02-01T00:00:00Z') }, now))
      .toBe('REUSED');
  });

  it('rejects expired refresh sessions and accepts active sessions', () => {
    expect(decideRefreshRotation({ revokedAt: null, expiresAt: new Date('2025-12-31T23:59:59Z') }, now)).toBe('EXPIRED');
    expect(decideRefreshRotation({ revokedAt: null, expiresAt: new Date('2026-01-01T00:00:01Z') }, now)).toBe('ROTATE');
  });

  it('enforces one-time, unexpired reset tokens', () => {
    expect(validateResetTokenState({ usedAt: null, expiresAt: new Date('2026-01-01T00:05:00Z') }, now)).toBe(true);
    expect(validateResetTokenState({ usedAt: now, expiresAt: new Date('2026-01-01T00:05:00Z') }, now)).toBe(false);
    expect(validateResetTokenState({ usedAt: null, expiresAt: new Date('2025-12-31T23:59:59Z') }, now)).toBe(false);
  });
});
