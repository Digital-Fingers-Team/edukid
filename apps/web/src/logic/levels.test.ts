import { describe, expect, it } from 'vitest';
import type { Level } from '../../../../shared/types';
import { suggestLevel } from './levels';

let t = 0;
const s = (level: Level, smooth: number, bumpy: number) => ({ levels: [level], smooth, bumpy, startedAt: ++t });

describe('suggestLevel', () => {
  it('stays with too little history', () => {
    expect(suggestLevel(1, [s(1, 10, 0), s(1, 10, 0)])).toEqual({ move: 'stay', level: 1 });
  });
  it('suggests up after 3 sessions at the level with bumpy ≤ 10%', () => {
    expect(suggestLevel(2, [s(1, 5, 5), s(2, 9, 1), s(2, 20, 0), s(2, 18, 2)])).toEqual({ move: 'up', level: 3 });
  });
  it('does not go above 5', () => {
    expect(suggestLevel(5, [s(5, 10, 0), s(5, 10, 0), s(5, 10, 0)])).toEqual({ move: 'stay', level: 5 });
  });
  it('suggests down after 2 sessions with bumpy > 30%', () => {
    expect(suggestLevel(3, [s(3, 6, 4), s(3, 5, 5)])).toEqual({ move: 'down', level: 2 });
  });
  it('ignores sessions with no taps', () => {
    expect(suggestLevel(3, [s(3, 6, 4), s(3, 0, 0), s(3, 5, 5)])).toEqual({ move: 'down', level: 2 });
  });
  it('uses the level the session ended on', () => {
    const mixed = { levels: [1, 2] as Level[], smooth: 10, bumpy: 0, startedAt: ++t };
    expect(suggestLevel(2, [mixed, s(2, 10, 0), s(2, 10, 1)])).toEqual({ move: 'up', level: 3 });
  });
});
