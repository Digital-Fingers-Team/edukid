import { ApiError, NetworkError } from '../api/client';
import type { LocalDb, OutboxEntry } from './db';

export type Sender = (method: string, path: string, body?: unknown) => Promise<unknown>;

export async function enqueue(d: LocalDb, e: Omit<OutboxEntry, 'seq' | 'key'>): Promise<void> {
  const key = `${e.method} ${e.path}`;
  await d.transaction('rw', d.outbox, async () => {
    const pending = await d.outbox.where('key').equals(key).first();
    await d.outbox.where('key').equals(key).delete();
    // PUTs replace (latest wins); PATCHes are partial, so queued ones merge.
    const body = e.method === 'PATCH' && pending?.body && e.body
      ? { ...(pending.body as object), ...(e.body as object) } : e.body;
    await d.outbox.add({ ...e, body, key });
  });
}

export async function flush(d: LocalDb, send: Sender): Promise<'done' | 'offline' | 'unauthorized'> {
  for (;;) {
    const next = await d.outbox.orderBy('seq').first();
    if (!next) return 'done';
    try {
      await send(next.method, next.path, next.body);
    } catch (err) {
      if (err instanceof NetworkError) return 'offline';
      if (err instanceof ApiError && err.status === 401) return 'unauthorized';
      if (err instanceof ApiError && err.status >= 500) return 'offline';
      console.warn('edukid: the server rejected a saved change; dropping it', next.path, err);
    }
    // Only delete the exact entry we sent: a newer write to the same path has a new seq.
    await d.outbox.delete(next.seq!);
  }
}
