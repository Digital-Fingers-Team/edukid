import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Child, SyncPayload } from '../../../../shared/types';
import { clearLocal, db } from './db';
import { addSticker, pullChild, reviewItem, saveRating, updateChild } from './repo';

const child: Child = { id: 'c1', name: 'نور', kg: 1, avatar: '1F981', stage: 1, stageSince: '2026-09-01',
  level: 1, recordingConsent: false, updatedAt: 1 };

beforeEach(async () => {
  await clearLocal();
  await db.children.put(child);
});
afterEach(() => vi.unstubAllGlobals());

const offline = () => vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));

describe('repo', () => {
  it('saveRating writes locally and queues the upload', async () => {
    offline();
    await saveRating('c1', '2026-09-24', 3);
    expect((await db.ratings.get(['c1', '2026-09-24']))?.value).toBe(3);
    const q = await db.outbox.toArray();
    expect(q).toMatchObject([{ method: 'PUT', path: '/api/children/c1/ratings/2026-09-24', body: { value: 3 } }]);
  });

  it('updateChild queues the full editable state so coalesced PATCHes lose nothing', async () => {
    offline();
    await updateChild('c1', { stage: 2, stageSince: '2026-10-10' });
    await updateChild('c1', { level: 3 });
    const q = await db.outbox.toArray();
    expect(q).toHaveLength(1);
    expect(q[0]!.body).toMatchObject({ stage: 2, stageSince: '2026-10-10', level: 3, name: 'نور' });
  });

  it('reviewItem moves the item through Leitner boxes and URL-encodes the id', async () => {
    offline();
    const p = await reviewItem('c1', 'math-3+4', true);
    expect(p.box).toBe(2);
    expect((await db.outbox.toArray())[0]!.path).toBe('/api/children/c1/items/math-3%2B4');
  });

  it('addSticker is only new once', async () => {
    offline();
    expect(await addSticker('c1', 'st-1F981')).toBe(true);
    expect(await addSticker('c1', 'st-1F981')).toBe(false);
  });

  it('pullChild applies server data and remembers the sync time', async () => {
    const payload: SyncPayload = { child: { ...child, level: 2 }, sessions: [],
      ratings: [{ childId: 'c1', date: '2026-09-20', value: 1, updatedAt: 5 }], items: [], stickers: [], now: 777 };
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(payload))));
    expect(await pullChild('c1')).toBe('ok');
    expect((await db.children.get('c1'))?.level).toBe(2);
    expect((await db.ratings.get(['c1', '2026-09-20']))?.value).toBe(1);
    expect((await db.meta.get('since:c1'))?.value).toBe(777);
  });

  it('pullChild does not overwrite local changes that are still waiting to upload', async () => {
    offline();
    await saveRating('c1', '2026-09-24', 5);
    expect(await pullChild('c1')).toBe('skipped');
    expect((await db.ratings.get(['c1', '2026-09-24']))?.value).toBe(5);
  });
});
