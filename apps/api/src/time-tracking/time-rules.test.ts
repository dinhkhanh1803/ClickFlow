import { ConflictException } from '@nestjs/common';

import { assertValidManualInterval, durationSeconds, intervalsOverlap } from './time-rules';

describe('time tracking rules', () => {
  it('calculates positive server-side duration, including immediate stops', () => {
    const start = new Date('2026-07-19T00:00:00.000Z');
    expect(durationSeconds(start, new Date('2026-07-19T00:01:30.900Z'))).toBe(90);
    expect(durationSeconds(start, start)).toBe(1);
    expect(() => durationSeconds(start, new Date('2026-07-18T23:59:59.000Z'))).toThrow(ConflictException);
  });

  it('uses half-open intervals so adjacent entries do not overlap', () => {
    const first = { startedAt: new Date('2026-07-19T00:00:00.000Z'), endedAt: new Date('2026-07-19T01:00:00.000Z') };
    const adjacent = { startedAt: new Date('2026-07-19T01:00:00.000Z'), endedAt: new Date('2026-07-19T02:00:00.000Z') };
    const overlapping = { startedAt: new Date('2026-07-19T00:30:00.000Z'), endedAt: new Date('2026-07-19T01:30:00.000Z') };
    expect(intervalsOverlap(first, adjacent)).toBe(false);
    expect(intervalsOverlap(first, overlapping)).toBe(true);
  });

  it('requires manual entries to have a positive interval', () => {
    const instant = new Date('2026-07-19T00:00:00.000Z');
    expect(() => assertValidManualInterval(instant, instant)).toThrow(ConflictException);
  });
});
