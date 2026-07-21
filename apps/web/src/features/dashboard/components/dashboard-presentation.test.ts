import { describe, expect, it } from 'vitest';

import { greetingForDate } from './dashboard-presentation';

describe('greetingForDate', () => {
  it.each([
    [new Date(2026, 6, 19, 8), 'Good morning'],
    [new Date(2026, 6, 19, 14), 'Good afternoon'],
    [new Date(2026, 6, 19, 20), 'Good evening'],
  ])('uses the correct part-of-day greeting', (date, expected) => {
    expect(greetingForDate(date)).toBe(expected);
  });
});
