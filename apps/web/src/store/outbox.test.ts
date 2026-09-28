import { describe, expect, it, vi } from 'vitest';
import { ApiError, NetworkError } from '../api/client';
import { openLocalDb } from './db';
import { enqueue, flush } from './outbox';

const fresh = () => openLocalDb(`t-${Math.random()}`);

describe('outbox', () => {
  it('enqueue coalesces writes to the same path (latest wins)', async () => {
    const d = fresh();
    await enqueue(d, { method: 'PUT', path: '/api/children/c/sessions/s1', body: { smooth: 1 } });
    await enqueue(d, { method: 'PUT', path: '/api/children/c/ratings/2026-09-24', body: { value: 3 } });
    await enqueue(d, { method: 'PUT', path: '/api/children/c/sessions/s1', body: { smooth: 2 } });
    const all = await d.outbox.orderBy('seq').toArray();
    expect(all.map((e) => e.body)).toEqual([{ value: 3 }, { smooth: 2 }]);
  });

  it('flush sends in order and empties the outbox', async () => {
    const d = fresh();
    await enqueue(d, { method: 'PUT', path: '/a', body: 1 });
    await enqueue(d, { method: 'PUT', path: '/b', body: 2 });
    const send = vi.fn(async () => ({}));
    expect(await flush(d, send)).toBe('done');
    expect(send.mock.calls.map((c) => (c as unknown[])[1])).toEqual(['/a', '/b']);
    expect(await d.outbox.count()).toBe(0);
  });

  it('stops when offline and keeps everything', async () => {
    const d = fresh();
    await enqueue(d, { method: 'PUT', path: '/a' });
    expect(await flush(d, async () => { throw new NetworkError(); })).toBe('offline');
    expect(await d.outbox.count()).toBe(1);
  });

  it('401 stops the flush and keeps entries', async () => {
    const d = fresh();
    await enqueue(d, { method: 'PUT', path: '/a' });
    await enqueue(d, { method: 'PUT', path: '/b' });
    expect(await flush(d, async () => { throw new ApiError(401, 'unauthorized'); })).toBe('unauthorized');
    expect(await d.outbox.count()).toBe(2);
  });

  it('treats 5xx as temporary and keeps the entry', async () => {
    const d = fresh();
    await enqueue(d, { method: 'PUT', path: '/a' });
    expect(await flush(d, async () => { throw new ApiError(502, 'error'); })).toBe('offline');
    expect(await d.outbox.count()).toBe(1);
  });

  it('drops a write the server rejects for good (4xx) and carries on', async () => {
    const d = fresh();
    await enqueue(d, { method: 'PUT', path: '/bad' });
    await enqueue(d, { method: 'PUT', path: '/good' });
    const send = vi.fn(async (_m: string, p: string) => { if (p === '/bad') throw new ApiError(404, 'not_found'); return {}; });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await flush(d, send)).toBe('done');
    expect(send).toHaveBeenCalledTimes(2);
    expect(await d.outbox.count()).toBe(0);
  });
});
