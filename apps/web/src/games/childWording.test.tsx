import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { BalloonBoard } from './BalloonBoard';
import { BubblesBoard } from './BubblesBoard';
import { SnakeBoard } from './SnakeBoard';
import { TurtleBoard } from './TurtleBoard';
import { GAMES } from '../pages/VoiceGames';

// Spec §2: never tell the child "slow down" / "calm down" — that wording is for the parent guide only.
const BANNED = ['اهدى', 'براحة', 'بالراحة', 'ببطء', 'بهدوء', 'خد نفس'];

describe('child-facing game text', () => {
  it('game intros avoid calm-down / slow-down wording', () => {
    for (const g of Object.values(GAMES)) for (const w of BANNED) expect(g.hint).not.toContain(w);
  });
  it('game boards avoid calm-down / slow-down wording', () => {
    for (const Board of [TurtleBoard, BalloonBoard, SnakeBoard, BubblesBoard]) {
      const { container, unmount } = render(<Board getLevel={() => 0} onFinish={() => {}} />);
      for (const w of BANNED) expect(container.textContent).not.toContain(w);
      unmount();
    }
  });
});
