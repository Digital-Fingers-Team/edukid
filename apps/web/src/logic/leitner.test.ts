import { describe, expect, it } from 'vitest';
import type { ItemProgress } from '../../../../shared/types';
import { INTERVAL_MS, isMastered, pickRound, review, seeded } from './leitner';

const DAY = 86_400_000;
const NOW = 1_800_000_000_000;

describe('review', () => {
  it('starts unseen items in box 2 when correct, box 1 when wrong', () => {
    expect(review(undefined, 'c', 'i', true, NOW)).toMatchObject({ box: 2, dueAt: NOW + DAY });
    expect(review(undefined, 'c', 'i', false, NOW)).toMatchObject({ box: 1, dueAt: NOW });
  });
  it('moves up one box when correct, capped at 5', () => {
    const p: ItemProgress = { childId: 'c', itemId: 'i', box: 4, dueAt: 0, updatedAt: 0 };
    expect(review(p, 'c', 'i', true, NOW)).toMatchObject({ box: 5, dueAt: NOW + 14 * DAY });
    expect(review({ ...p, box: 5 }, 'c', 'i', true, NOW).box).toBe(5);
  });
  it('drops to box 1 when wrong', () => {
    const p: ItemProgress = { childId: 'c', itemId: 'i', box: 5, dueAt: 0, updatedAt: 0 };
    expect(review(p, 'c', 'i', false, NOW).box).toBe(1);
  });
  it('intervals are 0, 1, 3, 7, 14 days', () => {
    expect(INTERVAL_MS).toEqual({ 1: 0, 2: DAY, 3: 3 * DAY, 4: 7 * DAY, 5: 14 * DAY });
  });
  it('box 5 is mastered', () => {
    expect(isMastered({ childId: 'c', itemId: 'i', box: 5, dueAt: 0, updatedAt: 0 })).toBe(true);
    expect(isMastered(undefined)).toBe(false);
  });
});

describe('pickRound', () => {
  const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((id) => ({ id }));
  const p = (itemId: string, box: 1 | 2 | 3 | 4 | 5, dueAt: number): [string, ItemProgress] =>
    [itemId, { childId: 'c', itemId, box, dueAt, updatedAt: 0 }];

  it('prefers due low-box items, then unseen, and skips mastered items not yet due', () => {
    const progress = new Map([
      p('a', 5, NOW + DAY),   // mastered, not due → excluded while others exist
      p('b', 1, NOW - 1),     // due, box 1
      p('c', 3, NOW - 1),     // due, box 3
      p('d', 2, NOW + DAY),   // not due
    ]);
    const round = pickRound(items, progress, 4, NOW, seeded(1)).map((i) => i.id).sort();
    expect(round).toContain('b');
    expect(round).toContain('c');
    expect(round).not.toContain('a');
    expect(round).toHaveLength(4);
  });
  it('fills with not-due items when there is not enough due or unseen', () => {
    const few = items.slice(0, 3);
    const progress = new Map([p('a', 3, NOW + DAY), p('b', 4, NOW + DAY), p('c', 2, NOW + DAY)]);
    expect(pickRound(few, progress, 3, NOW, seeded(2))).toHaveLength(3);
  });
  it('never returns more items than exist', () => {
    expect(pickRound(items.slice(0, 2), new Map(), 6, NOW, seeded(3))).toHaveLength(2);
  });
});
