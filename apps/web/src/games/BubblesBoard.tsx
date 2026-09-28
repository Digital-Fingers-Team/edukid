import { useRef, useState } from 'react';
import { bubbleStep } from '../logic/motion';
import { useFrame } from './useFrame';

interface Bubble { id: number; x: number; r: number }

export function BubblesBoard({ getLevel, onFinish, goal = 25 }: { getLevel: () => number; onFinish: () => void; goal?: number }) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [count, setCount] = useState(0);
  const acc = useRef(0);
  const nextId = useRef(0);
  const done = count >= goal;

  useFrame((dt) => {
    const r = bubbleStep(acc.current, getLevel(), dt);
    acc.current = r.accMs;
    if (!r.spawn) return;
    const b = { id: nextId.current++, x: 10 + Math.random() * 80, r: 14 + Math.random() * 18 };
    setBubbles((bs) => [...bs.slice(-24), b]);
    setCount((c) => c + 1);
  }, !done);

  return (
    <div className="board">
      <div className="bubble-stage" aria-hidden="true">
        {bubbles.map((b) => (
          <span key={b.id} className="bubble" style={{ insetInlineStart: `${b.x}%`, width: b.r * 2, height: b.r * 2 }}
            onAnimationEnd={() => setBubbles((bs) => bs.filter((x) => x.id !== b.id))} />
        ))}
      </div>
      <p className="board-hint">{done ? 'فقاعات كتير حلوة!' : 'انفخ نفخة طويلة ناعمة، زي ما بتطفي شمعة من بعيد'}</p>
      {done && <button className="btn btn-primary" onClick={onFinish}>خلصنا</button>}
    </div>
  );
}
