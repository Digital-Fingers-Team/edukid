import type { Child, ChildEditable, ItemProgress, Kg, PracticeSession, SyncPayload } from '../../../../shared/types';
import { api, NetworkError } from '../api/client';
import { review } from '../logic/leitner';
import { todayKey } from '../logic/dates';
import { db, getMeta, setMeta } from './db';
import { enqueue } from './outbox';
import { kick } from './sync';

const base = (childId: string) => `/api/children/${encodeURIComponent(childId)}`;

export async function saveSession(s: PracticeSession): Promise<void> {
  await db.sessions.put(s);
  const { id, childId, updatedAt: _u, ...body } = s;
  await enqueue(db, { method: 'PUT', path: `${base(childId)}/sessions/${encodeURIComponent(id)}`, body });
  void kick();
}

export async function saveRating(childId: string, date: string, value: number): Promise<void> {
  await db.ratings.put({ childId, date, value, updatedAt: Date.now() });
  await enqueue(db, { method: 'PUT', path: `${base(childId)}/ratings/${date}`, body: { value } });
  void kick();
}

export async function reviewItem(childId: string, itemId: string, correct: boolean): Promise<ItemProgress> {
  const prev = await db.items.get([childId, itemId]);
  const next = review(prev, childId, itemId, correct, Date.now());
  await db.items.put(next);
  await enqueue(db, { method: 'PUT', path: `${base(childId)}/items/${encodeURIComponent(itemId)}`,
    body: { box: next.box, dueAt: next.dueAt } });
  void kick();
  return next;
}

export async function addSticker(childId: string, stickerId: string): Promise<boolean> {
  if (await db.stickers.get([childId, stickerId])) return false;
  const now = Date.now();
  await db.stickers.put({ childId, stickerId, earnedAt: now, updatedAt: now });
  await enqueue(db, { method: 'PUT', path: `${base(childId)}/stickers/${stickerId}`, body: { earnedAt: now } });
  void kick();
  return true;
}

export async function updateChild(id: string, patch: Partial<ChildEditable>): Promise<void> {
  await db.children.update(id, { ...patch, updatedAt: Date.now() });
  const c = await db.children.get(id);
  if (!c) return;
  const body: ChildEditable = { name: c.name, kg: c.kg, avatar: c.avatar, stage: c.stage,
    stageSince: c.stageSince, level: c.level, recordingConsent: c.recordingConsent };
  await enqueue(db, { method: 'PATCH', path: base(id), body });
  void kick();
}

/** Needs a connection: children are created on the server so every device agrees on the id. */
export async function createChild(input: { name: string; kg: Kg; avatar: string }): Promise<Child> {
  const c = await api<Child>('POST', '/api/children', { ...input, stageSince: todayKey() });
  await db.children.put(c);
  return c;
}

export async function deleteChild(id: string): Promise<void> {
  await api('DELETE', base(id));
  await db.transaction('rw', [db.children, db.sessions, db.ratings, db.items, db.stickers, db.meta], async () => {
    await db.children.delete(id);
    await db.sessions.where('childId').equals(id).delete();
    await db.ratings.where('childId').equals(id).delete();
    await db.items.where('childId').equals(id).delete();
    await db.stickers.where('childId').equals(id).delete();
    await db.meta.delete(`since:${id}`);
  });
}

export async function refreshChildren(): Promise<void> {
  const list = await api<Child[]>('GET', '/api/children');
  const pending = await db.outbox.count();
  await db.transaction('rw', db.children, async () => {
    if (pending) {
      for (const c of list) if (!(await db.children.get(c.id))) await db.children.put(c);
    } else {
      await db.children.clear();
      await db.children.bulkPut(list);
    }
  });
}

export async function pullChild(childId: string): Promise<'ok' | 'skipped' | 'offline'> {
  await kick();
  if (await db.outbox.count()) return 'skipped';
  const sinceKey = `since:${childId}`;
  const since = (await getMeta<number>(sinceKey)) ?? 0;
  let data: SyncPayload;
  try {
    data = await api<SyncPayload>('GET', `${base(childId)}/sync?since=${since}`);
  } catch (err) {
    if (err instanceof NetworkError) return 'offline';
    throw err;
  }
  await db.transaction('rw', [db.children, db.sessions, db.ratings, db.items, db.stickers, db.meta], async () => {
    await db.children.put(data.child);
    await db.sessions.bulkPut(data.sessions);
    await db.ratings.bulkPut(data.ratings);
    await db.items.bulkPut(data.items);
    await db.stickers.bulkPut(data.stickers);
    await setMeta(sinceKey, data.now);
  });
  return 'ok';
}
