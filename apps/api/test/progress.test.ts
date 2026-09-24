import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addChild, makeApp, signup } from './helpers.ts';

const session = { date: '2026-09-24', startedAt: 1_790_000_000_000, durationSec: 420, levels: [1, 2],
  smooth: 12, bumpy: 2, corrections: 1, note: '' };

test('session upsert is idempotent and shows up in sync', async () => {
  const { app } = await makeApp();
  const { headers } = await signup(app);
  const c = await addChild(app, headers);
  const url = `/api/children/${c.id}/sessions/sess-0001`;
  assert.equal((await app.inject({ method: 'PUT', url, headers, payload: session })).statusCode, 200);
  assert.equal((await app.inject({ method: 'PUT', url, headers, payload: { ...session, smooth: 15 } })).statusCode, 200);
  const sync = (await app.inject({ method: 'GET', url: `/api/children/${c.id}/sync?since=0`, headers })).json();
  assert.equal(sync.sessions.length, 1);
  assert.equal(sync.sessions[0].smooth, 15);
  assert.deepEqual(sync.sessions[0].levels, [1, 2]);
  assert.equal(sync.child.id, c.id);
});

test('second rating PUT for the same day replaces the first', async () => {
  const { app } = await makeApp();
  const { headers } = await signup(app);
  const c = await addChild(app, headers);
  const url = `/api/children/${c.id}/ratings/2026-09-24`;
  await app.inject({ method: 'PUT', url, headers, payload: { value: 4 } });
  await app.inject({ method: 'PUT', url, headers, payload: { value: 2 } });
  const sync = (await app.inject({ method: 'GET', url: `/api/children/${c.id}/sync?since=0`, headers })).json();
  assert.deepEqual(sync.ratings.map((r: { date: string; value: number }) => [r.date, r.value]), [['2026-09-24', 2]]);
});

test('ratings must be 0–9 on a real date key', async () => {
  const { app } = await makeApp();
  const { headers } = await signup(app);
  const c = await addChild(app, headers);
  assert.equal((await app.inject({ method: 'PUT', url: `/api/children/${c.id}/ratings/2026-09-24`, headers, payload: { value: 10 } })).statusCode, 400);
  assert.equal((await app.inject({ method: 'PUT', url: `/api/children/${c.id}/ratings/yesterday`, headers, payload: { value: 1 } })).statusCode, 400);
});

test("a parent cannot write to another parent's child or hijack a session id", async () => {
  const { app } = await makeApp();
  const a = await signup(app, 'a@example.com');
  const b = await signup(app, 'b@example.com');
  const ca = await addChild(app, a.headers);
  const cb = await addChild(app, b.headers);
  const foreign = await app.inject({ method: 'PUT', url: `/api/children/${ca.id}/ratings/2026-09-24`, headers: b.headers, payload: { value: 1 } });
  assert.equal(foreign.statusCode, 404);
  await app.inject({ method: 'PUT', url: `/api/children/${ca.id}/sessions/shared-id-1`, headers: a.headers, payload: session });
  const hijack = await app.inject({ method: 'PUT', url: `/api/children/${cb.id}/sessions/shared-id-1`, headers: b.headers, payload: { ...session, smooth: 0 } });
  assert.equal(hijack.statusCode, 409);
  const sync = (await app.inject({ method: 'GET', url: `/api/children/${ca.id}/sync?since=0`, headers: a.headers })).json();
  assert.equal(sync.sessions[0].smooth, 12);
});

test('sync only returns rows changed since the given time', async () => {
  const { app } = await makeApp();
  const { headers } = await signup(app);
  const c = await addChild(app, headers);
  await app.inject({ method: 'PUT', url: `/api/children/${c.id}/ratings/2026-09-23`, headers, payload: { value: 3 } });
  const first = (await app.inject({ method: 'GET', url: `/api/children/${c.id}/sync?since=0`, headers })).json();
  await new Promise((r) => setTimeout(r, 5));
  await app.inject({ method: 'PUT', url: `/api/children/${c.id}/ratings/2026-09-24`, headers, payload: { value: 1 } });
  const next = (await app.inject({ method: 'GET', url: `/api/children/${c.id}/sync?since=${first.now + 1}`, headers })).json();
  assert.deepEqual(next.ratings.map((r: { date: string }) => r.date), ['2026-09-24']);
});

test('item progress and stickers round-trip; first sticker earn is kept', async () => {
  const { app } = await makeApp();
  const { headers } = await signup(app);
  const c = await addChild(app, headers);
  const item = await app.inject({ method: 'PUT', url: `/api/children/${c.id}/items/${encodeURIComponent('math-3+4')}`, headers, payload: { box: 3, dueAt: 123 } });
  assert.equal(item.statusCode, 200);
  await app.inject({ method: 'PUT', url: `/api/children/${c.id}/stickers/st-1F981`, headers, payload: { earnedAt: 100 } });
  await app.inject({ method: 'PUT', url: `/api/children/${c.id}/stickers/st-1F981`, headers, payload: { earnedAt: 999 } });
  const sync = (await app.inject({ method: 'GET', url: `/api/children/${c.id}/sync?since=0`, headers })).json();
  assert.deepEqual(sync.items.map((i: { itemId: string; box: number }) => [i.itemId, i.box]), [['math-3+4', 3]]);
  assert.equal(sync.stickers[0].earnedAt, 100);
});
