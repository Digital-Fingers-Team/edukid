import type { Level, PracticeSession } from '../../../../shared/types';

type SessionLike = Pick<PracticeSession, 'levels' | 'smooth' | 'bumpy' | 'startedAt'>;

export function suggestLevel(current: Level, sessions: SessionLike[]): { move: 'up' | 'down' | 'stay'; level: Level } {
  const atLevel = sessions
    .filter((s) => s.levels[s.levels.length - 1] === current && s.smooth + s.bumpy > 0)
    .sort((a, b) => a.startedAt - b.startedAt);
  const bumpyShare = (s: SessionLike) => s.bumpy / (s.smooth + s.bumpy);

  const last2 = atLevel.slice(-2);
  if (current > 1 && last2.length === 2 && last2.every((s) => bumpyShare(s) > 0.3)) {
    return { move: 'down', level: (current - 1) as Level };
  }
  const last3 = atLevel.slice(-3);
  if (current < 5 && last3.length === 3 && last3.every((s) => bumpyShare(s) <= 0.1)) {
    return { move: 'up', level: (current + 1) as Level };
  }
  return { move: 'stay', level: current };
}
