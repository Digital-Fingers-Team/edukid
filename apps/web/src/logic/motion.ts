/** Loudness level (0–1) above which we treat the child as speaking. */
export const VOICE_ON = 0.3;
const QUIET = 0.15;
const BLOW_ON = 0.2;
/** Reaching loud speech within this long after silence counts as a hard (sudden) start. */
const HARD_START_MS = 60;

export function rmsToLevel(rms: number): number {
  if (rms <= 0) return 0;
  const db = 20 * Math.log10(rms);
  return Math.max(0, Math.min(1, (db + 60) / 50));
}

/** Turtle crosses the track in ~4 s of voice. Speed never depends on loudness. */
export function turtleStep(progress: number, level: number, dtMs: number): number {
  return level >= VOICE_ON ? Math.min(1, progress + dtMs / 4000) : progress;
}

export interface BalloonState { size: number; wobbleMs: number; sinceQuietMs: number }
export const balloonStart: BalloonState = { size: 0, wobbleMs: 0, sinceQuietMs: 0 };

export function balloonStep(s: BalloonState, level: number, dtMs: number): BalloonState {
  const hardStart = level > 0.75 && s.sinceQuietMs < HARD_START_MS;
  const wobbleMs = hardStart ? 600 : Math.max(0, s.wobbleMs - dtMs);
  const grow = level >= VOICE_ON && wobbleMs === 0 ? dtMs / 3500 : 0;
  return {
    size: Math.min(1, s.size + grow),
    wobbleMs,
    sinceQuietMs: level < QUIET ? 0 : s.sinceQuietMs + dtMs,
  };
}

export interface SnakeState { length: number; voicedMs: number; silentMs: number; done: boolean }
export const snakeStart: SnakeState = { length: 0, voicedMs: 0, silentMs: 0, done: false };

export function snakeStep(s: SnakeState, level: number, dtMs: number): SnakeState {
  if (s.done) return s;
  if (level >= VOICE_ON) {
    const length = Math.min(1, s.length + dtMs / 3000);
    return { length, voicedMs: s.voicedMs + dtMs, silentMs: 0, done: length >= 1 };
  }
  const silentMs = s.silentMs + dtMs;
  return { ...s, silentMs, done: s.voicedMs >= 800 && silentMs >= 600 };
}

export function bubbleStep(accMs: number, level: number, dtMs: number): { spawn: boolean; accMs: number } {
  if (level < BLOW_ON) return { spawn: false, accMs: 0 };
  const acc = accMs + dtMs;
  return acc >= 180 ? { spawn: true, accMs: acc - 180 } : { spawn: false, accMs: acc };
}
