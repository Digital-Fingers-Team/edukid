import { ApiError, NetworkError } from '../api/client';
import type { LocalDb, OutboxEntry } from './db';

export type Sender = (method: string, path: string, body?: unknown) => Promise<unknown>;

export async function enqueue(d: LocalDb, e: Omit<OutboxEntry, 'seq' | 'key'>): Promise<void> {
  const key = `${e.method} ${e.path}`;
  await d.transaction('rw', d.outbox, async () => {
    await d.outbox.where('key').equals(key).delete();
    await d.outbox.add({ ...e, key });
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
