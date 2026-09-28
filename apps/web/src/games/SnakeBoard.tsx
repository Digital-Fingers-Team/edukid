import { useMemo, useState } from 'react';
import { Art } from '../art/Art';
import { Snake } from '../art/Snake';
import { speech } from '../content';
import { shuffle } from '../logic/leitner';
import { snakeStart, snakeStep } from '../logic/motion';
import { Dots } from './TurtleBoard';
import { useFrame } from './useFrame';

const TURNS = 5;
const STRETCHY = ['س', 'ش', 'ف', 'م', 'ن', 'ل', 'و', 'ع'];

export function SnakeBoard({ getLevel, onFinish }: { getLevel: () => number; onFinish: () => void }) {
  const words = useMemo(
    () => shuffle(speech.words.filter((w) => STRETCHY.includes(w.text[0]!))).slice(0, TURNS), []);
  const [turn, setTurn] = useState(0);
  const [s, setS] = useState(snakeStart);

  useFrame((dt) => setS((prev) => snakeStep(prev, getLevel(), dt)), !s.done);

  const next = () => {
    if (turn + 1 >= TURNS) onFinish();
    else { setTurn(turn + 1); setS(snakeStart); }
  };
  const word = words[turn]!;
  const first = word.text[0]!;

  return (
    <div className="board">
      <div className="word-card">
        <Art code={word.art} size={110} />
        <span><span className="stretch">{first}ـــ</span>{word.text.slice(1)}</span>
      </div>
      <div className="snake-stage"><Snake length={s.length} /></div>
      <p className="board-hint">{s.done ? 'الثعبان طوّل!' : `مطّ أول صوت «${first}» زي الثعبان، وبعدين كمّل الكلمة`}</p>
      {s.done && <button className="btn btn-primary" onClick={next}>{turn + 1 >= TURNS ? 'خلصنا' : 'كلمة كمان'}</button>}
      <Dots n={TURNS} at={turn} />
    </div>
  );
}
