import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { addChild, makeApp, multipart, signup } from './helpers.ts';

const audio = Buffer.from('fake-webm-bytes-0123456789');
const upload = (type = 'audio/webm;codecs=opus', data = audio) =>
  multipart({ durationSec: '95' }, { name: 'audio', filename: 'sample.webm', type, data });

test('upload is refused without consent', async () => {
  const { app } = await makeApp();
  const { headers } = await signup(app);
  const c = await addChild(app, headers);
  const m = upload();
  const res = await app.inject({ method: 'POST', url: `/api/children/${c.id}/recordings`, payload: m.payload, headers: { ...headers, ...m.headers } });
  assert.equal(res.statusCode, 403);
  assert.equal(res.json().error, 'no_consent');
});

test('with consent: upload, list, play back, delete', async () => {
  const { app, dataDir } = await makeApp();
  const { headers } = await signup(app);
  const c = await addChild(app, headers);
  await app.inject({ method: 'PATCH', url: `/api/children/${c.id}`, headers, payload: { recordingConsent: true } });
  const m = upload();
  const res = await app.inject({ method: 'POST', url: `/api/children/${c.id}/recordings`, payload: m.payload, headers: { ...headers, ...m.headers } });
  assert.equal(res.statusCode, 201);
  const meta = res.json();
  assert.equal(meta.durationSec, 95);
  assert.equal(meta.mime, 'audio/webm');
  const list = (await app.inject({ method: 'GET', url: `/api/children/${c.id}/recordings`, headers })).json();
  assert.equal(list.length, 1);
  const play = await app.inject({ method: 'GET', url: `/api/children/${c.id}/recordings/${meta.id}/audio`, headers });
  assert.equal(play.statusCode, 200);
  assert.equal(play.headers['content-type'], 'audio/webm');
  assert.deepEqual(play.rawPayload, audio);
  const del = await app.inject({ method: 'DELETE', url: `/api/children/${c.id}/recordings/${meta.id}`, headers });
  assert.equal(del.statusCode, 204);
  assert.deepEqual(await readdir(join(dataDir, 'recordings', c.id)), []);
});

test('unsupported types are refused', async () => {
  const { app } = await makeApp();
  const { headers } = await signup(app);
  const c = await addChild(app, headers);
  await app.inject({ method: 'PATCH', url: `/api/children/${c.id}`, headers, payload: { recordingConsent: true } });
  const m = upload('text/html');
  const res = await app.inject({ method: 'POST', url: `/api/children/${c.id}/recordings`, payload: m.payload, headers: { ...headers, ...m.headers } });
  assert.equal(res.statusCode, 415);
});

test('files over 10 MB are refused and not kept', async () => {
  const { app, dataDir } = await makeApp();
  const { headers } = await signup(app);
  const c = await addChild(app, headers);
  await app.inject({ method: 'PATCH', url: `/api/children/${c.id}`, headers, payload: { recordingConsent: true } });
  const m = upload('audio/webm', Buffer.alloc(10 * 1024 * 1024 + 10));
  const res = await app.inject({ method: 'POST', url: `/api/children/${c.id}/recordings`, payload: m.payload, headers: { ...headers, ...m.headers } });
  assert.equal(res.statusCode, 413);
  const files = await readdir(join(dataDir, 'recordings', c.id)).catch(() => []);
  assert.deepEqual(files, []);
});

test("another parent cannot list or play a child's recordings", async () => {
  const { app } = await makeApp();
  const a = await signup(app, 'a@example.com');
  const b = await signup(app, 'b@example.com');
  const c = await addChild(app, a.headers);
  await app.inject({ method: 'PATCH', url: `/api/children/${c.id}`, headers: a.headers, payload: { recordingConsent: true } });
  const m = upload();
  const meta = (await app.inject({ method: 'POST', url: `/api/children/${c.id}/recordings`, payload: m.payload, headers: { ...a.headers, ...m.headers } })).json();
  assert.equal((await app.inject({ method: 'GET', url: `/api/children/${c.id}/recordings`, headers: b.headers })).statusCode, 404);
  assert.equal((await app.inject({ method: 'GET', url: `/api/children/${c.id}/recordings/${meta.id}/audio`, headers: b.headers })).statusCode, 404);
});
