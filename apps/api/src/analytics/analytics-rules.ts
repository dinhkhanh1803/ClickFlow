export function searchRank(name: string, query: string): number {
  const normalizedName = name.trim().toLocaleLowerCase();
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (normalizedName === normalizedQuery) return 3;
  if (normalizedName.startsWith(normalizedQuery)) return 2;
  return normalizedName.includes(normalizedQuery) ? 1 : 0;
}

export function escapeLikePattern(query: string): string {
  return query.replace(/[\\%_]/g, (character) => `\\${character}`);
}

export function utcDayKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function utcDayBounds(now = new Date()): { from: Date; to: Date } {
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return { from, to: new Date(from.getTime() + 86_400_000) };
}
