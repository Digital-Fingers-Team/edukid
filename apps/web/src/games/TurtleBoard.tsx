import { useMemo, useState } from 'react';
import { Art } from '../art/Art';
import { Turtle } from '../art/Turtle';
import { speech } from '../content';
import { shuffle } from '../logic/leitner';
import { turtleStep, VOICE_ON } from '../logic/motion';
import { useFrame } from './useFrame';

const TURNS = 5;

export function TurtleBoard({ getLevel, onFinish }: { getLevel: () => number; onFinish: () => void }) {
  const words = useMemo(() => shuffle(speech.words).slice(0, TURNS), []);
  const [turn, setTurn] = useState(0);
  const [progress, setProgress] = useState(0);
  const [talking, setTalking] = useState(false);
  const arrived = progress >= 1;

  useFrame((dt) => {
    const level = getLevel();
    setTalking(level >= VOICE_ON);
    setProgress((p) => turtleStep(p, level, dt));
  }, !arrived);

  const next = () => {
    if (turn + 1 >= TURNS) onFinish();
    else { setTurn(turn + 1); setProgress(0); }
  };
  const word = words[turn]!;

  return (
    <div className="board">
      <div className="word-card"><Art code={word.art} size={120} /><span>{word.text}</span></div>
      <div className="track" aria-hidden="true">
        <div className="track-goal"><Art code="1F96C" size={48} /></div>
        <div className="track-runner" style={{ insetInlineStart: `${progress * 72}%` }}>
          <Turtle size={110} walking={talking && !arrived} />
        </div>
      </div>
      <p className="board-hint">{arrived ? 'وصلت السلحفاة!' : 'قول الكلمة بنعومة ومطّها، والسلحفاة تمشي'}</p>
      {arrived && <button className="btn btn-primary" onClick={next}>{turn + 1 >= TURNS ? 'خلصنا' : 'الكلمة اللي بعدها'}</button>}
      <Dots n={TURNS} at={turn} />
    </div>
  );
}

export function Dots({ n, at }: { n: number; at: number }) {
  return (
    <div className="dots" aria-label={`${at + 1} من ${n}`}>
      {Array.from({ length: n }, (_, i) => <span key={i} className={i < at ? 'done' : i === at ? 'now' : ''} />)}
    </div>
  );
}
