import { describe, expect, it } from 'vitest';
import { balloonStart, balloonStep, bubbleStep, rmsToLevel, snakeStart, snakeStep, turtleStep } from './motion';

const run = <S>(s: S, step: (s: S, l: number, dt: number) => S, levels: number[], dt = 16) =>
  levels.reduce((acc, l) => step(acc, l, dt), s);

describe('rmsToLevel', () => {
  it('maps silence to 0 and loud speech to 1', () => {
    expect(rmsToLevel(0)).toBe(0);
    expect(rmsToLevel(0.0005)).toBe(0);
    expect(rmsToLevel(0.5)).toBe(1);
    expect(rmsToLevel(0.03)).toBeGreaterThan(0.3);
  });
});

describe('turtle', () => {
  it('walks only while there is voice, and never past the end', () => {
    expect(turtleStep(0.2, 0.1, 500)).toBe(0.2);
    expect(turtleStep(0.2, 0.5, 400)).toBeCloseTo(0.3);
    expect(turtleStep(0.99, 0.9, 1000)).toBe(1);
  });
  it('does not walk faster for louder voice (no reward for pushing)', () => {
    expect(turtleStep(0, 0.4, 100)).toBe(turtleStep(0, 1, 100));
  });
});

describe('balloon', () => {
  it('grows with a gentle start', () => {
    const ramp = [0.05, 0.2, 0.35, 0.5, 0.65, 0.8, ...Array(60).fill(0.6)];
    const s = run(balloonStart, balloonStep, ramp);
    expect(s.size).toBeGreaterThan(0.2);
    expect(s.wobbleMs).toBe(0);
  });
  it('wobbles instead of growing after a sudden loud start', () => {
    const s = run(balloonStart, balloonStep, [0.02, 0.9]);
    expect(s.wobbleMs).toBeGreaterThan(0);
    const later = balloonStep(s, 0.9, 16);
    expect(later.size).toBe(s.size);
  });
  it('the wobble wears off and growth resumes', () => {
    const s = run(balloonStart, balloonStep, [0.02, 0.9, ...Array(50).fill(0.5)]);
    expect(s.wobbleMs).toBe(0);
    expect(s.size).toBeGreaterThan(0);
  });
});

describe('snake', () => {
  it('grows while the sound is held and ends after a pause', () => {
    let s = run(snakeStart, snakeStep, Array(70).fill(0.5)); // ~1.1 s of voice
    expect(s.length).toBeGreaterThan(0.3);
    expect(s.done).toBe(false);
    s = run(s, snakeStep, Array(40).fill(0)); // 640 ms of quiet
    expect(s.done).toBe(true);
  });
  it('a short blip does not end the turn', () => {
    const s = run(snakeStart, snakeStep, [...Array(10).fill(0.5), ...Array(50).fill(0)]);
    expect(s.done).toBe(false);
  });
});

describe('bubbles', () => {
  it('spawns steadily while blowing, not at all when quiet', () => {
    let acc = 0;
    let spawned = 0;
    for (let i = 0; i < 60; i++) { const r = bubbleStep(acc, 0.25, 16); acc = r.accMs; if (r.spawn) spawned++; }
    expect(spawned).toBeGreaterThanOrEqual(4);
    expect(bubbleStep(0, 0.05, 1000).spawn).toBe(false);
  });
});
