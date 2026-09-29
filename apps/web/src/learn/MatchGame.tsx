import { useMemo, useRef, useState } from 'react';
import { shuffle } from '../logic/leitner';
import { speak } from '../lib/speak';
import { ItemFace } from './ItemFace';
import type { GameProps } from './LearnRound';

export function MatchGame({ items, onDone }: GameProps) {
  const left = items;
  const right = useMemo(() => shuffle(items), [items]);
  const [picked, setPicked] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const missed = useRef(new Set<string>());

  function pickRight(id: string) {
    if (!picked || matched.has(id)) return;
    if (id === picked) {
      const next = new Set(matched).add(id);
      setMatched(next);
      setPicked(null);
      const item = items.find((i) => i.id === id)!;
      speak(item.say, item.lang);
      if (next.size === items.length) {
        setTimeout(() => onDone(items.map((i) => ({ itemId: i.id, correct: !missed.current.has(i.id) }))), 700);
      }
    } else {
      missed.current.add(picked);
      setWrong(id);
      setTimeout(() => setWrong(null), 500);
    }
  }

  return (
    <div className="learn-game match">
      <p className="learn-hint">وصّل كل صورة باللي يشبهها</p>
      <div className="match-cols">
        <div className="match-col">
          {left.map((i) => (
            <button key={i.id} className={`choice${picked === i.id ? ' picked' : ''}${matched.has(i.id) ? ' matched' : ''}`}
              onClick={() => !matched.has(i.id) && setPicked(i.id)} aria-label={`صورة ${i.label}`}>
              <ItemFace item={i} side="question" />
            </button>
          ))}
        </div>
        <div className="match-col">
          {right.map((i) => (
            <button key={i.id} className={`choice${matched.has(i.id) ? ' matched' : ''}${wrong === i.id ? ' shake' : ''}`}
              onClick={() => pickRight(i.id)} aria-label={i.label}>
              {i.subject === 'en-words' ? <span className="face-text en">{i.label}</span> : <ItemFace item={i} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
