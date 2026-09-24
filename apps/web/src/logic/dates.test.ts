import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, toDateKey, weekStart } from './dates';

describe('dates', () => {
  it('toDateKey uses local time, not UTC', () => {
    // 00:30 local on 3 Oct 2026 — in UTC+3 this is still 2 Oct in UTC
    const d = new Date(2026, 9, 3, 0, 30);
    expect(toDateKey(d)).toBe('2026-10-03');
  });
  it('addDays crosses month ends', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('weekStart is the Saturday on or before the date', () => {
    expect(weekStart('2026-09-26')).toBe('2026-09-26'); // Saturday
    expect(weekStart('2026-09-24')).toBe('2026-09-19'); // Thursday
    expect(weekStart('2026-09-25')).toBe('2026-09-19'); // Friday
  });
  it('daysBetween counts calendar days', () => {
    expect(daysBetween('2026-09-19', '2026-10-03')).toBe(14);
  });
});
