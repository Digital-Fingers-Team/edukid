import { useEffect, useMemo, useRef, useState } from 'react';
import type { Child, Level, PracticeSession } from '../../../../shared/types';
import { Art } from '../art/Art';
import { LEVEL_NAMES, levelDeck, speech, toArabicDigits } from '../content';
import { todayKey } from '../logic/dates';
import { shuffle } from '../logic/leitner';
import { emptyTaps, onTap, type Prompt, type TapState } from '../logic/praise';
import { newId } from '../lib/ids';
import { saveSession } from '../store/repo';

const TEN_MIN = 600;

export function TalkingGame({ child, onEnd }: { child: Child; onEnd: (s: PracticeSession) => void }) {
  const [level, setLevel] = useState<Level>(child.level);
  const [levels, setLevels] = useState<Level[]>([child.level]);
  const [taps, setTaps] = useState<TapState>(emptyTaps);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const meta = useRef({ id: newId(), startedAt: Date.now(), date: todayKey() });

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.round((Date.now() - meta.current.startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const deck = useMemo(() => {
    const d = levelDeck(level);
    if (d.kind === 'cards') return { kind: 'cards' as const, cards: shuffle(d.cards) };
    if (d.kind === 'stories') return { kind: 'stories' as const, frames: shuffle(d.stories).flatMap((s) => s.frames) };
    return { kind: 'prompts' as const, prompts: shuffle(d.prompts) };
  }, [level]);
  const size = deck.kind === 'cards' ? deck.cards.length : deck.kind === 'stories' ? deck.frames.length : deck.prompts.length;

  function snapshot(t: TapState, ls: Level[]): PracticeSession {
    return {
      id: meta.current.id, childId: child.id, date: meta.current.date, startedAt: meta.current.startedAt,
      durationSec: Math.round((Date.now() - meta.current.startedAt) / 1000),
      levels: ls, smooth: t.smooth, bumpy: t.bumpy, corrections: t.corrections, note: '', updatedAt: Date.now(),
    };
  }

  function tap(kind: 'smooth' | 'bumpy') {
    const r = onTap(taps, kind, speech);
    setTaps(r.state);
    setPrompt(r.prompt);
    void saveSession(snapshot(r.state, levels));
  }

  function changeLevel(delta: 1 | -1) {
    const next = Math.min(5, Math.max(1, level + delta)) as Level;
    if (next === level) return;
    const ls = levels[levels.length - 1] === next ? levels : [...levels, next];
    setLevel(next);
    setLevels(ls);
    setIndex(0);
    setPrompt(null);
    void saveSession(snapshot(taps, ls));
  }

  async function end() {
    const s = snapshot(taps, levels);
    await saveSession(s);
    onEnd(s);
  }

  const i = index % Math.max(1, size);
  return (
    <div className="talk">
      <section className="talk-stage" aria-live="polite">
        {deck.kind === 'cards' && (
          <div className="talk-card"><Art code={deck.cards[i]!.art} size={150} /><p>{deck.cards[i]!.text}</p></div>
        )}
        {deck.kind === 'stories' && (
          <div className="talk-card"><Art code={deck.frames[i]!.art} size={150} /><p>{deck.frames[i]!.text}</p>
            <small className="muted">احكوا مع بعض: إيه اللي بيحصل في الصورة؟</small></div>
        )}
        {deck.kind === 'prompts' && (
          <div className="talk-card prompt-card"><Art code="1F4AC" size={90} /><p>{deck.prompts[i]}</p></div>
        )}
        <div className="talk-nav">
          <button className="round-btn" aria-label="اللي قبلها" onClick={() => setIndex((x) => (x - 1 + size) % size)}>›</button>
          <button className="round-btn" aria-label="اللي بعدها" onClick={() => setIndex((x) => x + 1)}>‹</button>
        </div>
      </section>

      <section className="parent-dock" aria-label="أزرار ولي الأمر">
        <div className="say">
          {prompt?.kind === 'praise' && <p><span className="say-label">قول:</span> {prompt.text}</p>}
          {prompt?.kind === 'correction' && <p><span className="say-label">ممكن تقول بلطف:</span> {prompt.text}</p>}
          {prompt?.kind === 'none' && <p className="muted">كمّلوا عادي، ولا تعليق.</p>}
          {!prompt && <p className="muted">لما كلامه يطلع ناعم دوس «كلام ناعم». لما يكون فيه تقطيع دوس «فيه مطبات».</p>}
        </div>
        <div className="dock-buttons">
          <button className="btn dock-smooth" onClick={() => tap('smooth')}>كلام ناعم</button>
          <button className="btn dock-bumpy" onClick={() => tap('bumpy')}>فيه مطبات</button>
        </div>
        <div className="dock-row">
          <span className="chip">المستوى: {LEVEL_NAMES[level]}</span>
          <button className="btn btn-quiet" aria-label="مستوى أسهل" onClick={() => changeLevel(-1)} disabled={level === 1}>أسهل</button>
          <button className="btn btn-quiet" aria-label="مستوى أصعب" onClick={() => changeLevel(1)} disabled={level === 5}>أصعب</button>
          <span className={`chip timer${elapsed >= TEN_MIN ? ' enough' : ''}`} dir="ltr" aria-label="وقت الجلسة">
            {toArabicDigits(Math.floor(elapsed / 60))}:{toArabicDigits(String(elapsed % 60).padStart(2, '0'))}
          </span>
          <button className="btn btn-primary" onClick={() => void end()}>خلصنا</button>
        </div>
        {elapsed >= TEN_MIN && <p className="muted enough-note">عدّوا ١٠ دقايق. ممكن تخلصوا دلوقتي.</p>}
      </section>
    </div>
  );
}
