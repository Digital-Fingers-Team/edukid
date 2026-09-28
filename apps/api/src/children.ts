import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { Child, Kg, Level, Stage } from '../../../shared/types.ts';
import type { Db } from './db.ts';
import type { AppOptions } from './app.ts';
import { removeChildFiles } from './files.ts';

export interface ChildRow {
  id: string; parent_id: string; name: string; kg: number; avatar: string; stage: number;
  stage_since: string; level: number; recording_consent: number; updated_at: number;
}

export function childFromRow(r: ChildRow): Child {
  return {
    id: r.id, name: r.name, kg: r.kg as Kg, avatar: r.avatar, stage: r.stage as Stage,
    stageSince: r.stage_since, level: r.level as Level, recordingConsent: r.recording_consent === 1,
    updatedAt: r.updated_at,
  };
}

export function ownChild(db: Db, parentId: string, childId: string): ChildRow | undefined {
  return db.prepare('SELECT * FROM children WHERE id = ? AND parent_id = ?').get(childId, parentId) as
    ChildRow | undefined;
}

export const DATE = { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' } as const;
const fields = {
  name: { type: 'string', minLength: 1, maxLength: 40 },
  kg: { type: 'integer', enum: [1, 2] },
  avatar: { type: 'string', pattern: '^[0-9A-F-]{2,20}$' },
  stage: { type: 'integer', enum: [1, 2] },
  stageSince: DATE,
  level: { type: 'integer', minimum: 1, maximum: 5 },
  recordingConsent: { type: 'boolean' },
} as const;
const idParams = { type: 'object', properties: { id: { type: 'string', maxLength: 64 } } } as const;

const COLUMN: Record<string, string> = {
  name: 'name', kg: 'kg', avatar: 'avatar', stage: 'stage', stageSince: 'stage_since',
  level: 'level', recordingConsent: 'recording_consent',
};

export async function childrenRoutes(app: FastifyInstance, o: AppOptions) {
  const { db } = o;

  app.get('/api/children', async (req) => {
    const rows = db.prepare('SELECT * FROM children WHERE parent_id = ? ORDER BY rowid').all(req.parentId) as unknown as ChildRow[];
    return rows.map(childFromRow);
  });

  app.post('/api/children', {
    schema: { body: { type: 'object', additionalProperties: false, required: ['name', 'kg', 'avatar', 'stageSince'],
      properties: { name: fields.name, kg: fields.kg, avatar: fields.avatar, stageSince: fields.stageSince } } },
  }, async (req, reply) => {
    const b = req.body as { name: string; kg: number; avatar: string; stageSince: string };
    const id = randomUUID();
    db.prepare(`INSERT INTO children (id, parent_id, name, kg, avatar, stage, stage_since, level, recording_consent, updated_at)
                VALUES (?, ?, ?, ?, ?, 1, ?, 1, 0, ?)`)
      .run(id, req.parentId, b.name.trim(), b.kg, b.avatar, b.stageSince, Date.now());
    return reply.code(201).send(childFromRow(ownChild(db, req.parentId, id)!));
  });

  app.patch('/api/children/:id', {
    schema: { params: idParams, body: { type: 'object', additionalProperties: false, minProperties: 1, properties: fields } },
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    if (!ownChild(db, req.parentId, id)) return reply.code(404).send({ error: 'not_found' });
    const body = req.body as Record<string, string | number | boolean>;
    const sets: string[] = [];
    const values: (string | number)[] = [];
    for (const [k, v] of Object.entries(body)) {
      sets.push(`${COLUMN[k]} = ?`);
      values.push(typeof v === 'boolean' ? Number(v) : typeof v === 'string' ? v.trim() : v);
    }
    db.prepare(`UPDATE children SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`).run(...values, Date.now(), id);
    return childFromRow(ownChild(db, req.parentId, id)!);
  });

  app.delete('/api/children/:id', { schema: { params: idParams } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    if (!ownChild(db, req.parentId, id)) return reply.code(404).send({ error: 'not_found' });
    await removeChildFiles(o.dataDir, id);
    db.prepare('DELETE FROM children WHERE id = ?').run(id);
    return reply.code(204).send();
  });
}
