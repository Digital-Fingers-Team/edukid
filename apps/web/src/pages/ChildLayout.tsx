import { createContext, useContext, useEffect } from 'react';
import { Navigate, Outlet, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Child } from '../../../../shared/types';
import { db } from '../store/db';
import { pullChild } from '../store/repo';
import { sessionTarget, shouldReturnToStage1, stage2Eligible } from '../logic/stages';
import { todayKey, weekStart } from '../logic/dates';

const ChildCtx = createContext<Child | null>(null);

export function useChild(): Child {
  const c = useContext(ChildCtx);
  if (!c) throw new Error('useChild outside ChildLayout');
  return c;
}

export function ChildLayout() {
  const { childId = '' } = useParams();
  const child = useLiveQuery(async () => (await db.children.get(childId)) ?? null, [childId]);
  useEffect(() => { void pullChild(childId).catch(() => {}); }, [childId]);
  if (child === undefined) return <div className="page" aria-busy="true" />;
  if (child === null) return <Navigate to="/children" replace />;
  return <ChildCtx.Provider value={child}><Outlet /></ChildCtx.Provider>;
}

export function useTodayPlan(child: Child) {
  const today = todayKey();
  const from = weekStart(today);
  const sessions = useLiveQuery(
    () => db.sessions.where('childId').equals(child.id).filter((s) => s.date >= from).toArray(), [child.id, from]) ?? [];
  const ratings = useLiveQuery(() => db.ratings.where('childId').equals(child.id).toArray(), [child.id]) ?? [];
  const done = sessions.filter((s) => s.durationSec >= 60);
  const proposal =
    child.stage === 1 && stage2Eligible(ratings, today, child.stageSince) ? 'stage2'
    : child.stage === 2 && shouldReturnToStage1(ratings, child.stageSince, today) ? 'stage1'
    : null;
  return {
    today,
    doneToday: done.some((s) => s.date === today),
    weekCount: done.length,
    perWeek: sessionTarget(child.stage, child.stageSince, today).perWeek,
    rating: ratings.find((r) => r.date === today)?.value,
    proposal: proposal as 'stage2' | 'stage1' | null,
  };
}
