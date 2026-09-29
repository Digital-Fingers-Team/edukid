import { useEffect, useMemo, useRef, useState } from 'react';
import { Art } from '../art/Art';
import { toArabicDigits } from '../content';
import { shuffle } from '../logic/leitner';
import { speak } from '../lib/speak';
import type { GameProps } from './LearnRound';

const THINGS = ['1F34E', '2B50', '1F41F', '1F388', '1F33B', '1F986'];

export function CountGame({ items, kg, onDone }: GameProps) {
  const item = items[0]!;
  const answer = item.count!;
  const thing = THINGS[item.id.length % THINGS.length]!;
  const math = item.subject === 'math' ? /^math-(\d+)([+-])(\d+)$/.exec(item.id) : null;
  const options = useMemo(() => {
    const set = new Set([answer]);
    const max = kg === 1 ? 10 : 20;
    while (set.size < (kg === 1 ? 3 : 4)) {
      const n = answer + Math.round((Math.random() - 0.5) * 6);
      if (n >= 0 && n <= max) set.add(n);
    }
    return shuffle([...set]);
  }, [answer, kg]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [right, setRight] = useState(false);
  const firstTry = useRef(true);
  const prompt = math ? `${item.say} يساوي كام؟` : 'عدّ معايا، كام واحد؟';

  useEffect(() => { speak(prompt, 'ar'); }, [prompt]);

  function choose(n: number) {
    if (right) return;
    if (n === answer) {
      setRight(true);
      speak(`${item.say}! برافو`, 'ar');
      setTimeout(() => onDone([{ itemId: item.id, correct: firstTry.current }]), 800);
    } else {
      firstTry.current = false;
      setWrong(n);
      setTimeout(() => setWrong(null), 500);
    }
  }

  const a = math ? Number(math[1]) : answer;
  const b = math ? Number(math[3]) : 0;
  const minus = math?.[2] === '-';
  return (
    <div className="learn-game">
      {math && <p className="math-expr">{item.label}</p>}
      <div className="count-field" aria-label={prompt}>
        {Array.from({ length: a }, (_, i) => (
          <span key={`a${i}`} className={minus && i >= a - b ? 'taken' : ''}><Art code={thing} size={40} /></span>
        ))}
        {math && !minus && <span className="plus">+</span>}
        {math && !minus && Array.from({ length: b }, (_, i) => <span key={`b${i}`}><Art code={thing} size={40} /></span>)}
      </div>
      <div className={`choices n${options.length}`}>
        {options.map((n) => (
          <button key={n} className={`choice${wrong === n ? ' shake' : ''}${right && n === answer ? ' yay' : ''}`}
            onClick={() => choose(n)} aria-label={String(n)}>
            <span className="face-text">{toArabicDigits(n)}</span>
          </button>
        ))}
      </div>
      <p className="learn-hint" aria-live="polite">{wrong !== null ? 'يلا نعدّ تاني' : right ? 'برافو!' : ' '}</p>
    </div>
  );
}
