import Dexie, { type EntityTable, type Table } from 'dexie';
import type { Child, ItemProgress, PracticeSession, Rating, Sticker } from '../../../../shared/types';

export interface OutboxEntry {
  seq?: number;
  key: string;
  method: 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
}
export interface MetaRow { key: string; value: unknown }

export type LocalDb = Dexie & {
  children: EntityTable<Child, 'id'>;
  sessions: EntityTable<PracticeSession, 'id'>;
  ratings: Table<Rating, [string, string]>;
  items: Table<ItemProgress, [string, string]>;
  stickers: Table<Sticker, [string, string]>;
  outbox: EntityTable<OutboxEntry, 'seq'>;
  meta: Table<MetaRow, string>;
};

export function openLocalDb(name = 'edukid'): LocalDb {
  const d = new Dexie(name) as LocalDb;
  d.version(1).stores({
    children: 'id',
    sessions: 'id, childId, date',
    ratings: '[childId+date], childId',
    items: '[childId+itemId], childId',
    stickers: '[childId+stickerId], childId',
    outbox: '++seq, &key',
    meta: 'key',
  });
  return d;
}

export const db = openLocalDb();

export async function getMeta<T>(key: string): Promise<T | undefined> {
  return (await db.meta.get(key))?.value as T | undefined;
}
export async function setMeta(key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value });
}
export async function clearLocal(): Promise<void> {
  await Promise.all(db.tables.map((t) => t.clear()));
}
