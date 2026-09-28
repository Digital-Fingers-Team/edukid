import type { Box, ItemProgress } from '../../../../shared/types';

const DAY = 86_400_000;
export const INTERVAL_MS: Record<Box, number> = { 1: 0, 2: DAY, 3: 3 * DAY, 4: 7 * DAY, 5: 14 * DAY };

export function review(
  prev: ItemProgress | undefined, childId: string, itemId: string, correct: boolean, now: number,
): ItemProgress {
  const from = prev?.box ?? 1;
  const box = (correct ? Math.min(5, from + 1) : 1) as Box;
  return { childId, itemId, box, dueAt: now + INTERVAL_MS[box], updatedAt: now };
}

export const isMastered = (p: ItemProgress | undefined) => p?.box === 5;

export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(xs: T[], rand: () => number = Math.random): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function pickRound<T extends { id: string }>(
  items: T[], progress: Map<string, ItemProgress>, size: number, now: number, rand: () => number = Math.random,
): T[] {
  const due: T[] = [];
  const unseen: T[] = [];
  const later: T[] = [];
  for (const item of items) {
    const p = progress.get(item.id);
    if (!p) unseen.push(item);
    else if (p.dueAt <= now) due.push(item);
    else later.push(item);
  }
  const box = (i: T) => progress.get(i.id)?.box ?? 1;
  due.sort((a, b) => box(a) - box(b));
  later.sort((a, b) => box(a) - box(b) || progress.get(a.id)!.dueAt - progress.get(b.id)!.dueAt);
  const picked = [...due, ...shuffle(unseen, rand), ...later].slice(0, size);
  return shuffle(picked, rand);
}
