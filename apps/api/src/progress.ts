import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Box, ItemProgress, Level, PracticeSession, Rating, Sticker, SyncPayload } from '../../../shared/types.ts';
import type { AppOptions } from './app.ts';
import { childFromRow, DATE, ownChild } from './children.ts';

/** A session left open overnight is stored as 2 hours rather than dropped. */
const MAX_SESSION_SEC = 7200;

const int = (min: number, max: number) => ({ type: 'integer', minimum: min, maximum: max }) as const;

const sessionBody = {
  type: 'object', additionalProperties: false,
  required: ['date', 'startedAt', 'durationSec', 'levels', 'smooth', 'bumpy', 'corrections', 'note'],
  properties: {
    date: DATE, startedAt: int(0, 9e15), durationSec: int(0, 9e9), // capped below, never rejected
    levels: { type: 'array', maxItems: 50, items: int(1, 5) },
    smooth: int(0, 100000), bumpy: int(0, 100000), corrections: int(0, 100000),
    note: { type: 'string', maxLength: 1000 },
  },
} as const;

interface SessionRow { id: string; child_id: string; date: string; started_at: number; duration_sec: number;
  levels: string; smooth: number; bumpy: number; corrections: number; note: string; updated_at: number }
const sessionFromRow = (r: SessionRow): PracticeSession => ({
  id: r.id, childId: r.child_id, date: r.date, startedAt: r.started_at, durationSec: r.duration_sec,
  levels: JSON.parse(r.levels) as Level[], smooth: r.smooth, bumpy: r.bumpy, corrections: r.corrections,
  note: r.note, updatedAt: r.updated_at,
});
const ratingFromRow = (r: { child_id: string; date: string; value: number; updated_at: number }): Rating =>
  ({ childId: r.child_id, date: r.date, value: r.value, updatedAt: r.updated_at });
const itemFromRow = (r: { child_id: string; item_id: string; box: number; due_at: number; updated_at: number }): ItemProgress =>
  ({ childId: r.child_id, itemId: r.item_id, box: r.box as Box, dueAt: r.due_at, updatedAt: r.updated_at });
const stickerFromRow = (r: { child_id: string; sticker_id: string; earned_at: number; updated_at: number }): Sticker =>
  ({ childId: r.child_id, stickerId: r.sticker_id, earnedAt: r.earned_at, updatedAt: r.updated_at });

export async function progressRoutes(app: FastifyInstance, o: AppOptions) {
  const { db } = o;
  const guard = (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const row = ownChild(db, req.parentId, id);
    if (!row) { reply.code(404).send({ error: 'not_found' }); return undefined; }
    return row;
  };

  app.put('/api/children/:id/sessions/:sid', {
    schema: { params: { type: 'object', properties: { id: { type: 'string' }, sid: { type: 'string', pattern: '^[A-Za-z0-9-]{8,64}$' } } }, body: sessionBody },
  }, async (req, reply) => {
    const child = guard(req, reply); if (!child) return reply;
    const { sid } = req.params as { sid: string };
    const b = req.body as Omit<PracticeSession, 'id' | 'childId' | 'updatedAt'>;
    const res = db.prepare(`
      INSERT INTO practice_sessions (id, child_id, date, started_at, duration_sec, levels, smooth, bumpy, corrections, note, updated_at)
      VALUES (:id, :child, :date, :started, :dur, :levels, :smooth, :bumpy, :corr, :note, :now)
      ON CONFLICT(id) DO UPDATE SET date = excluded.date, started_at = excluded.started_at,
        duration_sec = excluded.duration_sec, levels = excluded.levels, smooth = excluded.smooth,
        bumpy = excluded.bumpy, corrections = excluded.corrections, note = excluded.note, updated_at = excluded.updated_at
      WHERE practice_sessions.child_id = excluded.child_id`).run({
      id: sid, child: child.id, date: b.date, started: b.startedAt, dur: Math.min(b.durationSec, MAX_SESSION_SEC),
      levels: JSON.stringify(b.levels), smooth: b.smooth, bumpy: b.bumpy, corr: b.corrections, note: b.note, now: Date.now(),
    });
    if (res.changes === 0) return reply.code(409).send({ error: 'conflict' });
    return sessionFromRow(db.prepare('SELECT * FROM practice_sessions WHERE id = ?').get(sid) as unknown as SessionRow);
  });

  app.put('/api/children/:id/ratings/:date', {
    schema: { params: { type: 'object', properties: { id: { type: 'string' }, date: DATE } },
      body: { type: 'object', additionalProperties: false, required: ['value'], properties: { value: int(0, 9) } } },
  }, async (req, reply) => {
    const child = guard(req, reply); if (!child) return reply;
    const { date } = req.params as { date: string };
    const { value } = req.body as { value: number };
    db.prepare(`INSERT INTO ratings (child_id, date, value, updated_at) VALUES (?, ?, ?, ?)
                ON CONFLICT(child_id, date) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`)
      .run(child.id, date, value, Date.now());
    return ratingFromRow(db.prepare('SELECT * FROM ratings WHERE child_id = ? AND date = ?').get(child.id, date) as never);
  });

  app.put('/api/children/:id/items/:itemId', {
    schema: { params: { type: 'object', properties: { id: { type: 'string' }, itemId: { type: 'string', pattern: '^[A-Za-z0-9+\\-]{1,64}$' } } },
      body: { type: 'object', additionalProperties: false, required: ['box', 'dueAt'], properties: { box: int(1, 5), dueAt: int(0, 9e15) } } },
  }, async (req, reply) => {
    const child = guard(req, reply); if (!child) return reply;
    const { itemId } = req.params as { itemId: string };
    const { box, dueAt } = req.body as { box: number; dueAt: number };
    db.prepare(`INSERT INTO item_progress (child_id, item_id, box, due_at, updated_at) VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(child_id, item_id) DO UPDATE SET box = excluded.box, due_at = excluded.due_at, updated_at = excluded.updated_at`)
      .run(child.id, itemId, box, dueAt, Date.now());
    return itemFromRow(db.prepare('SELECT * FROM item_progress WHERE child_id = ? AND item_id = ?').get(child.id, itemId) as never);
  });

  app.put('/api/children/:id/stickers/:stickerId', {
    schema: { params: { type: 'object', properties: { id: { type: 'string' }, stickerId: { type: 'string', pattern: '^st-[0-9A-F-]{2,20}$' } } },
      body: { type: 'object', additionalProperties: false, required: ['earnedAt'], properties: { earnedAt: int(0, 9e15) } } },
  }, async (req, reply) => {
    const child = guard(req, reply); if (!child) return reply;
    const { stickerId } = req.params as { stickerId: string };
    const { earnedAt } = req.body as { earnedAt: number };
    db.prepare(`INSERT INTO stickers (child_id, sticker_id, earned_at, updated_at) VALUES (?, ?, ?, ?)
                ON CONFLICT(child_id, sticker_id) DO NOTHING`).run(child.id, stickerId, earnedAt, Date.now());
    return stickerFromRow(db.prepare('SELECT * FROM stickers WHERE child_id = ? AND sticker_id = ?').get(child.id, stickerId) as never);
  });

  app.get('/api/children/:id/sync', {
    schema: { querystring: { type: 'object', properties: { since: { type: 'integer', minimum: 0, default: 0 } } } },
  }, async (req, reply) => {
    const child = guard(req, reply); if (!child) return reply;
    const { since } = req.query as { since: number };
    const now = Date.now();
    const q = (table: string) =>
      db.prepare(`SELECT * FROM ${table} WHERE child_id = ? AND updated_at >= ?`).all(child.id, since) as never[];
    const payload: SyncPayload = {
      child: childFromRow(child),
      sessions: q('practice_sessions').map(sessionFromRow),
      ratings: q('ratings').map(ratingFromRow),
      items: q('item_progress').map(itemFromRow),
      stickers: q('stickers').map(stickerFromRow),
      now,
    };
    return payload;
  });
}
