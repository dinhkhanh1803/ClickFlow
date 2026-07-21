import { escapeLikePattern, searchRank, utcDayBounds, utcDayKey } from './analytics-rules';

describe('analytics rules', () => {
  it('ranks exact, prefix and contains matches deterministically', () => {
    expect(searchRank('Launch', 'launch')).toBe(3);
    expect(searchRank('Launch plan', 'launch')).toBe(2);
    expect(searchRank('Client launch plan', 'launch')).toBe(1);
    expect(searchRank('Roadmap', 'launch')).toBe(0);
  });

  it('escapes SQL LIKE control characters', () => {
    expect(escapeLikePattern('100%_done\\next')).toBe('100\\%\\_done\\\\next');
  });

  it('uses explicit UTC day boundaries', () => {
    const bounds = utcDayBounds(new Date('2026-07-19T23:59:59.000Z'));
    expect(bounds.from.toISOString()).toBe('2026-07-19T00:00:00.000Z');
    expect(bounds.to.toISOString()).toBe('2026-07-20T00:00:00.000Z');
    expect(utcDayKey(bounds.from)).toBe('2026-07-19');
  });
});
