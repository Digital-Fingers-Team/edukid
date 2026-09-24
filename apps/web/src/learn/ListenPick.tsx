import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { shuffle } from '../logic/leitner';
import { speak } from '../lib/speak';
import { ItemFace } from './ItemFace';
import type { GameProps } from './LearnRound';

export function ListenPick({ items, pool, kg, onDone }: GameProps) {
  const target = items[0]!;
  const choices = useMemo(
    () => shuffle([target, ...shuffle(pool.filter((p) => p.id !== target.id)).slice(0, kg === 1 ? 2 : 3)]),
    [target, pool, kg]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [right, setRight] = useState(false);
  const firstTry = useRef(true);
  const prompt = target.lang === 'ar' ? `فين ${target.say}؟` : `Where is ${target.say}?`;

  useEffect(() => { speak(prompt, target.lang); }, [prompt, target.lang]);

  function choose(id: string) {
    if (right) return;
    if (id === target.id) {
      setRight(true);
      speak(target.lang === 'ar' ? 'برافو!' : 'Great!', target.lang);
      setTimeout(() => onDone([{ itemId: target.id, correct: firstTry.current }]), 700);
    } else {
      firstTry.current = false;
      setWrong(id);
      setTimeout(() => setWrong(null), 500);
    }
  }

  return (
    <div className="learn-game" data-target-id={target.id}>
      <button className="listen-btn" onClick={() => speak(prompt, target.lang)} aria-label="اسمع تاني">
        <Icon name="speaker" size={34} />
      </button>
      <div className={`choices n${choices.length}`}>
        {choices.map((c) => (
          <button key={c.id} data-id={c.id}
            className={`choice${wrong === c.id ? ' shake' : ''}${right && c.id === target.id ? ' yay' : ''}`}
            onClick={() => choose(c.id)} aria-label={c.label}>
            <ItemFace item={c} />
          </button>
        ))}
      </div>
      <p className="learn-hint" aria-live="polite">{wrong ? 'حاول تاني' : right ? 'برافو!' : ' '}</p>
    </div>
  );
}
