import { describe, expect, it } from 'vitest';
import { emptyTaps, onTap, type TapState } from './praise';

const phrases = { praise: ['P0', 'P1', 'P2'], correction: ['C0', 'C1'] };
const run = (taps: ('smooth' | 'bumpy')[]) => {
  let state: TapState = emptyTaps;
  const prompts = taps.map((t) => {
    const r = onTap(state, t, phrases);
    state = r.state;
    return r.prompt;
  });
  return { state, prompts };
};

describe('onTap', () => {
  it('praises every smooth tap, rotating phrases', () => {
    const { prompts } = run(['smooth', 'smooth', 'smooth', 'smooth']);
    expect(prompts.map((p) => (p.kind === 'praise' ? p.text : p.kind))).toEqual(['P0', 'P1', 'P2', 'P0']);
  });
  it('says nothing for bumpy speech until there are 5 praises per correction', () => {
    const { prompts, state } = run(['smooth', 'smooth', 'smooth', 'smooth', 'bumpy']);
    expect(prompts[4]).toEqual({ kind: 'none' });
    expect(state.bumpy).toBe(1);
    expect(state.corrections).toBe(0);
  });
  it('suggests a gentle correction once the ratio allows it', () => {
    const { prompts, state } = run(['smooth', 'smooth', 'smooth', 'smooth', 'smooth', 'bumpy']);
    expect(prompts[5]).toEqual({ kind: 'correction', text: 'C0' });
    expect(state.corrections).toBe(1);
  });
  it('never corrects two bumpy taps in a row', () => {
    const taps = Array<'smooth'>(20).fill('smooth') as ('smooth' | 'bumpy')[];
    const { prompts } = run([...taps, 'bumpy', 'bumpy']);
    expect(prompts[20]!.kind).toBe('correction');
    expect(prompts[21]).toEqual({ kind: 'none' });
  });
  it('keeps smooth:corrections at 5:1 or more', () => {
    const pattern: ('smooth' | 'bumpy')[] = [];
    for (let i = 0; i < 40; i++) pattern.push(i % 3 === 0 ? 'bumpy' : 'smooth');
    const { state } = run(pattern);
    expect(state.smooth / Math.max(1, state.corrections)).toBeGreaterThanOrEqual(5);
  });
});
