import type { Stage } from '../../../../shared/types';
import { addDays, daysBetween, weekStart } from './dates';

export interface DayRating { date: string; value: number }
export interface WeekSummary { start: string; rated: number; average: number | null; lowDays: number }

export function summarizeWeek(ratings: DayRating[], start: string): WeekSummary {
  const end = addDays(start, 7);
  const inWeek = ratings.filter((r) => r.date >= start && r.date < end);
  const rated = inWeek.length;
  const sum = inWeek.reduce((a, r) => a + r.value, 0);
  return {
    start,
    rated,
    average: rated ? Math.round((sum / rated) * 100) / 100 : null,
    lowDays: inWeek.filter((r) => r.value <= 1).length,
  };
}

export function stage2Eligible(ratings: DayRating[], today: string): boolean {
  const current = weekStart(today);
  return [21, 14, 7].every((back) => {
    const w = summarizeWeek(ratings, addDays(current, -back));
    return w.rated >= 4 && w.average !== null && w.average <= 1.5 && w.lowDays >= 4;
  });
}

export function shouldReturnToStage1(ratings: DayRating[], stageSince: string, today: string): boolean {
  const current = weekStart(today);
  const earliest = weekStart(stageSince);
  return [current, addDays(current, -7)]
    .filter((start) => start >= earliest)
    .some((start) => {
      const w = summarizeWeek(ratings.filter((r) => r.date >= stageSince), start);
      return w.rated >= 3 && w.average !== null && w.average > 2.5;
    });
}

export function stage2PerWeek(stageSince: string, today: string): number {
  const weeks = Math.floor(daysBetween(stageSince, today) / 7);
  if (weeks < 2) return 3;
  if (weeks < 4) return 2;
  if (weeks < 8) return 1;
  return 0.5;
}

export function sessionTarget(stage: Stage, stageSince: string, today: string): { perWeek: number } {
  return { perWeek: stage === 1 ? 7 : stage2PerWeek(stageSince, today) };
}
