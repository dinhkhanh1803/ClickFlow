export type RefreshDecision = 'EXPIRED' | 'REUSED' | 'ROTATE';

export function decideRefreshRotation(
  session: { revokedAt: Date | null; expiresAt: Date },
  now = new Date()
): RefreshDecision {
  if (session.revokedAt) return 'REUSED';
  if (session.expiresAt.getTime() <= now.getTime()) return 'EXPIRED';
  return 'ROTATE';
}

export function validateResetTokenState(
  token: { usedAt: Date | null; expiresAt: Date },
  now = new Date()
): boolean {
  return token.usedAt === null && token.expiresAt.getTime() > now.getTime();
}
