import { useState } from 'react';
import { Balloon } from '../art/Balloon';
import { balloonStart, balloonStep } from '../logic/motion';
import { Dots } from './TurtleBoard';
import { useFrame } from './useFrame';

const TURNS = 4;
const COLORS = ['#D2543F', '#4F82B5', '#5E8C6B', '#E3AE3C'];

export function BalloonBoard({ getLevel, onFinish }: { getLevel: () => number; onFinish: () => void }) {
  const [turn, setTurn] = useState(0);
  const [s, setS] = useState(balloonStart);
  const full = s.size >= 1;

  useFrame((dt) => setS((prev) => balloonStep(prev, getLevel(), dt)), !full);

  const next = () => {
    if (turn + 1 >= TURNS) onFinish();
    else { setTurn(turn + 1); setS(balloonStart); }
  };

  return (
    <div className="board">
      <div className={`balloon-stage${full ? ' fly' : ''}`}>
        <Balloon size={s.size} color={COLORS[turn % COLORS.length]!} wobble={s.wobbleMs > 0} />
      </div>
      <p className="board-hint">{full ? 'البالونة طارت!' : 'ابدأ الصوت بهدوء خالص: «آآآه»، والبالونة تكبر'}</p>
      {full && <button className="btn btn-primary" onClick={next}>{turn + 1 >= TURNS ? 'خلصنا' : 'بالونة كمان'}</button>}
      <Dots n={TURNS} at={turn} />
    </div>
  );
}
