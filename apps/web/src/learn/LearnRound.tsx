import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import type { Kg } from '../../../../shared/types';
import { ChildScreen } from '../components/ChildScreen';
import { StickerReward } from '../components/StickerReward';
import { SUBJECTS, itemsFor, type ContentItem, type GameKind, type Subject } from '../content';
import { pickRound } from '../logic/leitner';
import { db } from '../store/db';
import { reviewItem } from '../store/repo';
import { useChild } from '../pages/ChildLayout';
import { Dots } from '../games/TurtleBoard';
import { ListenPick } from './ListenPick';
import { MatchGame } from './MatchGame';
import { CountGame } from './CountGame';
import { TraceGame } from './TraceGame';

export interface GameProps {
  items: ContentItem[];
  pool: ContentItem[];
  kg: Kg;
  onDone(results: { itemId: string; correct: boolean }[]): void;
}
export const CHUNK: Record<GameKind, number> = { listen: 1, count: 1, trace: 1, match: 3 };
const GAME = { listen: ListenPick, match: MatchGame, count: CountGame, trace: TraceGame } as const;
const ROUND = 6;

export function LearnRound() {
  const child = useChild();
  const nav = useNavigate();
  const { subject = '', game = '' } = useParams();
  const meta = SUBJECTS.find((s) => s.id === subject);
  const [round, setRound] = useState<ContentItem[] | null>(null);
  const [step, setStep] = useState(0);

  const valid = !!meta && (meta.games as string[]).includes(game);
  const pool = useMemo(() => (valid ? itemsFor(subject as Subject, child.kg) : []), [valid, subject, child.kg]);

  useEffect(() => {
    if (!valid) return;
    let alive = true;
    void db.items.where('childId').equals(child.id).toArray().then((rows) => {
      const progress = new Map(rows.map((r) => [r.itemId, r]));
      // Trace draws one character: keep single letters, "Aa" pairs and one-digit numbers.
      const usable = game === 'trace' ? pool.filter((i) => i.subject !== 'numbers' || [...i.label].length === 1) : pool;
      if (alive) setRound(pickRound(usable, progress, ROUND, Date.now()));
    });
    return () => { alive = false; };
  }, [child.id, game, valid, pool]);

  if (!valid) return <Navigate to=".." relative="path" replace />;
  if (!round) return <ChildScreen title={meta!.title}><div aria-busy="true" /></ChildScreen>;

  const size = CHUNK[game as GameKind];
  const chunks = Math.ceil(round.length / size);
  if (step >= chunks) {
    return (
      <ChildScreen title={meta!.title}>
        <StickerReward childId={child.id} onDone={() => nav('..', { relative: 'path' })} />
      </ChildScreen>
    );
  }
  const Game = GAME[game as GameKind];
  const items = round.slice(step * size, step * size + size);
  return (
    <ChildScreen title={meta!.title}>
      <Game key={step} items={items} pool={pool} kg={child.kg}
        onDone={async (results) => {
          for (const r of results) await reviewItem(child.id, r.itemId, r.correct);
          setStep((s) => s + 1);
        }} />
      <Dots n={chunks} at={step} />
    </ChildScreen>
  );
}
