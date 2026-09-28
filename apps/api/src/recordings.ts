import { randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { FastifyInstance } from 'fastify';
import type { RecordingMeta } from '../../../shared/types.ts';
import type { AppOptions } from './app.ts';
import { ownChild } from './children.ts';
import { childDir } from './files.ts';

/** Per child: a monthly sample for two years. Also protects the shared server's disk. */
const MAX_RECORDINGS = 24;

const EXT: Record<string, string> = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/mpeg': 'mp3' };

interface RecRow { id: string; child_id: string; created_at: number; duration_sec: number; mime: string; file: string }
const metaFromRow = (r: RecRow): RecordingMeta =>
  ({ id: r.id, childId: r.child_id, createdAt: r.created_at, durationSec: r.duration_sec, mime: r.mime });

export async function recordingRoutes(app: FastifyInstance, o: AppOptions) {
  const { db } = o;
  const findRec = (childId: string, rid: string) =>
    db.prepare('SELECT * FROM recordings WHERE id = ? AND child_id = ?').get(rid, childId) as RecRow | undefined;

  app.post('/api/children/:id/recordings', { config: { rateLimit: { max: 6, timeWindow: '1 minute' } } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const child = ownChild(db, req.parentId, id);
    if (!child) return reply.code(404).send({ error: 'not_found' });
    if (child.recording_consent !== 1) return reply.code(403).send({ error: 'no_consent' });
    const { n } = db.prepare('SELECT COUNT(*) AS n FROM recordings WHERE child_id = ?').get(child.id) as { n: number };
    if (n >= MAX_RECORDINGS) return reply.code(409).send({ error: 'too_many_recordings' });
    const data = await req.file();
    if (!data) return reply.code(400).send({ error: 'no_file' });
    const mime = data.mimetype.split(';')[0]!.trim().toLowerCase();
    const ext = EXT[mime];
    if (!ext) { data.file.resume(); return reply.code(415).send({ error: 'unsupported_type' }); }
    const durationField = data.fields.durationSec as { value?: string } | undefined;
    const durationSec = Math.max(0, Math.min(600, Math.round(Number(durationField?.value ?? 0)) || 0));
    const rid = randomUUID();
    const dir = childDir(o.dataDir, child.id);
    await mkdir(dir, { recursive: true });
    const file = join(dir, `${rid}.${ext}`);
    try {
      await pipeline(data.file, createWriteStream(file));
    } catch (err) {
      await rm(file, { force: true });
      throw err; // @fastify/multipart raises a 413 error for oversized files
    }
    if (data.file.truncated) {
      await rm(file, { force: true });
      return reply.code(413).send({ error: 'too_large' });
    }
    const createdAt = Date.now();
    db.prepare('INSERT INTO recordings (id, child_id, created_at, duration_sec, mime, file) VALUES (?, ?, ?, ?, ?, ?)')
      .run(rid, child.id, createdAt, durationSec, mime, file);
    return reply.code(201).send({ id: rid, childId: child.id, createdAt, durationSec, mime } satisfies RecordingMeta);
  });

  app.get('/api/children/:id/recordings', async (req, reply) => {
    const { id } = req.params as { id: string };
    if (!ownChild(db, req.parentId, id)) return reply.code(404).send({ error: 'not_found' });
    const rows = db.prepare('SELECT * FROM recordings WHERE child_id = ? ORDER BY created_at DESC').all(id) as unknown as RecRow[];
    return rows.map(metaFromRow);
  });

  app.get('/api/children/:id/recordings/:rid/audio', async (req, reply) => {
    const { id, rid } = req.params as { id: string; rid: string };
    if (!ownChild(db, req.parentId, id)) return reply.code(404).send({ error: 'not_found' });
    const rec = findRec(id, rid);
    if (!rec) return reply.code(404).send({ error: 'not_found' });
    reply.header('content-type', rec.mime).header('cache-control', 'private, no-store');
    return reply.send(createReadStream(rec.file));
  });

  app.delete('/api/children/:id/recordings/:rid', async (req, reply) => {
    const { id, rid } = req.params as { id: string; rid: string };
    if (!ownChild(db, req.parentId, id)) return reply.code(404).send({ error: 'not_found' });
    const rec = findRec(id, rid);
    if (!rec) return reply.code(404).send({ error: 'not_found' });
    await rm(rec.file, { force: true });
    db.prepare('DELETE FROM recordings WHERE id = ?').run(rid);
    return reply.code(204).send();
  });
}
