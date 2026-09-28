export interface TapState { smooth: number; bumpy: number; corrections: number; lastWasCorrection: boolean }
export type Prompt = { kind: 'praise'; text: string } | { kind: 'correction'; text: string } | { kind: 'none' };

export const emptyTaps: TapState = { smooth: 0, bumpy: 0, corrections: 0, lastWasCorrection: false };

const RATIO = 5;

export function onTap(
  s: TapState,
  kind: 'smooth' | 'bumpy',
  phrases: { praise: string[]; correction: string[] },
): { state: TapState; prompt: Prompt } {
  if (kind === 'smooth') {
    const text = phrases.praise[s.smooth % phrases.praise.length]!;
    return { state: { ...s, smooth: s.smooth + 1, lastWasCorrection: false }, prompt: { kind: 'praise', text } };
  }
  const allowed = !s.lastWasCorrection && s.smooth >= RATIO * (s.corrections + 1);
  if (!allowed) {
    return { state: { ...s, bumpy: s.bumpy + 1, lastWasCorrection: false }, prompt: { kind: 'none' } };
  }
  const text = phrases.correction[s.corrections % phrases.correction.length]!;
  return {
    state: { ...s, bumpy: s.bumpy + 1, corrections: s.corrections + 1, lastWasCorrection: true },
    prompt: { kind: 'correction', text },
  };
}
