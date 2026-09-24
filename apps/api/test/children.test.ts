import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { addChild, makeApp, signup } from './helpers.ts';

test('a parent creates and lists children', async () => {
  const { app } = await makeApp();
  const { headers } = await signup(app);
  const child = await addChild(app, headers, 'عمر');
  assert.deepEqual(
    { name: child.name, kg: child.kg, stage: child.stage, level: child.level, recordingConsent: child.recordingConsent, stageSince: child.stageSince },
    { name: 'عمر', kg: 1, stage: 1, level: 1, recordingConsent: false, stageSince: '2026-09-24' },
  );
  const list = await app.inject({ method: 'GET', url: '/api/children', headers });
  assert.equal(list.json().length, 1);
});

test('another parent cannot see, change or delete the child', async () => {
  const { app } = await makeApp();
  const a = await signup(app, 'a@example.com');
  const b = await signup(app, 'b@example.com');
  const child = await addChild(app, a.headers);
  assert.equal((await app.inject({ method: 'GET', url: '/api/children', headers: b.headers })).json().length, 0);
  const patch = await app.inject({ method: 'PATCH', url: `/api/children/${child.id}`, headers: b.headers, payload: { name: 'x' } });
  assert.equal(patch.statusCode, 404);
  const del = await app.inject({ method: 'DELETE', url: `/api/children/${child.id}`, headers: b.headers });
  assert.equal(del.statusCode, 404);
});

test('PATCH updates editable fields and bumps updatedAt', async () => {
  const { app } = await makeApp();
  const { headers } = await signup(app);
  const child = await addChild(app, headers);
  await new Promise((r) => setTimeout(r, 5));
  const res = await app.inject({ method: 'PATCH', url: `/api/children/${child.id}`, headers,
    payload: { stage: 2, stageSince: '2026-10-10', level: 3, recordingConsent: true } });
  assert.equal(res.statusCode, 200);
  const c = res.json();
  assert.equal(c.stage, 2);
  assert.equal(c.level, 3);
  assert.equal(c.recordingConsent, true);
  assert.ok(c.updatedAt > child.updatedAt);
});

test('invalid values are rejected', async () => {
  const { app } = await makeApp();
  const { headers } = await signup(app);
  const res = await app.inject({ method: 'POST', url: '/api/children', headers,
    payload: { name: 'x', kg: 3, avatar: '1F981', stageSince: '2026-09-24' } });
  assert.equal(res.statusCode, 400);
  const child = await addChild(app, headers);
  const lvl = await app.inject({ method: 'PATCH', url: `/api/children/${child.id}`, headers, payload: { level: 6 } });
  assert.equal(lvl.statusCode, 400);
});

test('DELETE removes the child and its files', async () => {
  const { app, dataDir } = await makeApp();
  const { headers } = await signup(app);
  const child = await addChild(app, headers);
  const dir = join(dataDir, 'recordings', child.id);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'x.webm'), 'x');
  const res = await app.inject({ method: 'DELETE', url: `/api/children/${child.id}`, headers });
  assert.equal(res.statusCode, 204);
  await assert.rejects(access(dir));
  assert.equal((await app.inject({ method: 'GET', url: '/api/children', headers })).json().length, 0);
});

test('children routes need a login', async () => {
  const { app } = await makeApp();
  assert.equal((await app.inject({ method: 'GET', url: '/api/children' })).statusCode, 401);
});
