import { describe, expect, it } from 'vitest';
import { addDays } from './dates';
import {
  sessionTarget, shouldReturnToStage1, stage2Eligible, stage2PerWeek, summarizeWeek, type DayRating,
} from './stages';

// Today is Thursday 2026-10-15; current week started Sat 2026-10-10.
// Completed weeks: 09-19, 09-26, 10-03.
const TODAY = '2026-10-15';
const week = (start: string, values: (number | null)[]): DayRating[] =>
  values.flatMap((v, i) => (v === null ? [] : [{ date: addDays(start, i), value: v }]));

describe('summarizeWeek', () => {
  it('averages only rated days and counts days rated 0–1', () => {
    const s = summarizeWeek(week('2026-09-19', [0, 1, 2, null, 1, null, 0]), '2026-09-19');
    expect(s).toEqual({ start: '2026-09-19', rated: 5, average: 0.8, lowDays: 4 });
  });
  it('returns null average for an empty week', () => {
    expect(summarizeWeek([], '2026-09-19').average).toBeNull();
  });
});

describe('stage2Eligible', () => {
  const good = (start: string) => week(start, [1, 0, 1, 2, 1, null, 1]);
  it('is true when the last 3 completed weeks all qualify', () => {
    const r = [...good('2026-09-19'), ...good('2026-09-26'), ...good('2026-10-03')];
    expect(stage2Eligible(r, TODAY)).toBe(true);
  });
  it('ignores the current, unfinished week', () => {
    const r = [...good('2026-09-19'), ...good('2026-09-26'), ...good('2026-10-03'),
      ...week('2026-10-10', [6, 6])];
    expect(stage2Eligible(r, TODAY)).toBe(true);
  });
  it('is false when a week has fewer than 4 rated days (sparse week)', () => {
    const r = [...good('2026-09-19'), ...week('2026-09-26', [0, 0, 0]), ...good('2026-10-03')];
    expect(stage2Eligible(r, TODAY)).toBe(false);
  });
  it('is false when a weekly average is above 1.5', () => {
    const r = [...good('2026-09-19'), ...week('2026-09-26', [2, 2, 1, 1, 2, 2, 1]), ...good('2026-10-03')];
    expect(stage2Eligible(r, TODAY)).toBe(false);
  });
  it('is false when fewer than 4 days are rated 0–1', () => {
    const r = [...good('2026-09-19'), ...week('2026-09-26', [0, 0, 0, 2, 2, 2, 2]), ...good('2026-10-03')];
    // average 1.14 but only 3 low days
    expect(stage2Eligible(r, TODAY)).toBe(false);
  });
});

describe('shouldReturnToStage1', () => {
  it('suggests return when the current week averages above 2.5 over 3+ days', () => {
    const r = week('2026-10-10', [3, 3, 2, 4]);
    expect(shouldReturnToStage1(r, '2026-09-01', TODAY)).toBe(true);
  });
  it('needs at least 3 rated days', () => {
    expect(shouldReturnToStage1(week('2026-10-10', [5, 5]), '2026-09-01', TODAY)).toBe(false);
  });
  it('ignores weeks before stage 2 started', () => {
    const r = week('2026-10-03', [5, 5, 5, 5]);
    expect(shouldReturnToStage1(r, '2026-10-10', TODAY)).toBe(false);
  });
});

describe('frequency', () => {
  it('steps down 3 → 2 → 1 → every 2 weeks', () => {
    expect(stage2PerWeek('2026-10-01', '2026-10-01')).toBe(3);
    expect(stage2PerWeek('2026-10-01', '2026-10-14')).toBe(3);
    expect(stage2PerWeek('2026-10-01', '2026-10-15')).toBe(2);
    expect(stage2PerWeek('2026-10-01', '2026-10-29')).toBe(1);
    expect(stage2PerWeek('2026-10-01', '2026-11-26')).toBe(0.5);
  });
  it('stage 1 is daily', () => {
    expect(sessionTarget(1, '2026-10-01', TODAY)).toEqual({ perWeek: 7 });
  });
});
